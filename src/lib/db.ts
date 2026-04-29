// 奉天F4Club — Database Operations

export interface User {
  id: number;
  nickname: string;
  role: string;
  password_hash: string;
  avatar_emoji: string;
  custom_avatar: string | null;
  created_at: string;
}

export interface Post {
  id: number;
  author_id: number;
  title: string;
  content: string;
  category: string;
  sport_type: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  author_nickname?: string;
  author_emoji?: string;
  author_role?: string;
  comment_count?: number;
  like_count?: number;
  liked_by_user?: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: number;
  content: string;
  created_at: string;
  // Joined fields
  author_nickname?: string;
  author_emoji?: string;
}

export interface CommentWithPostAuthor extends Comment {
  post_author_id: number;
}

let performanceIndexesPromise: Promise<void> | null = null;
let expandedCategoriesPromise: Promise<void> | null = null;

export async function ensurePerformanceIndexes(db: D1Database): Promise<void> {
  if (!performanceIndexesPromise) {
    performanceIndexesPromise = db
      .batch([
        db.prepare('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_posts_category_created_at ON posts(category, created_at DESC)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_posts_author_created_at ON posts(author_id, created_at DESC)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_comments_post_created_at ON comments(post_id, created_at ASC)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id)'),
      ])
      .then(() => undefined)
      .catch((error) => {
        performanceIndexesPromise = null;
        throw error;
      });
  }

  await performanceIndexesPromise;
}

// ---- Users ----

export async function getUserByNickname(db: D1Database, nickname: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE nickname = ?').bind(nickname).first<User>();
  return result || null;
}

export async function getUserById(db: D1Database, id: number): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
  return result || null;
}

export async function getAllUsers(db: D1Database): Promise<User[]> {
  const result = await db.prepare('SELECT id, nickname, role, avatar_emoji, custom_avatar, created_at FROM users').all<User>();
  return result.results || [];
}

export async function updateUserPassword(db: D1Database, id: number, hash: string): Promise<void> {
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hash, id).run();
}

export async function updateUserAvatar(db: D1Database, id: number, emoji: string): Promise<void> {
  await db.prepare('UPDATE users SET avatar_emoji = ? WHERE id = ?').bind(emoji, id).run();
}

// ---- Posts ----

export async function getPosts(
  db: D1Database,
  options: {
    category?: string;
    authorId?: number;
    limit?: number;
    offset?: number;
    userId?: number; // for like status
  } = {}
): Promise<Post[]> {
  const { category, authorId, limit = 20, offset = 0, userId } = options;
  await ensurePerformanceIndexes(db);

  let query = `
    WITH filtered_posts AS (
      SELECT p.*
      FROM posts p
  `;

  const conditions: string[] = [];
  const bindings: any[] = [];

  if (category) {
    conditions.push('p.category = ?');
    bindings.push(category);
  }
  if (authorId) {
    conditions.push('p.author_id = ?');
    bindings.push(authorId);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += `
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    )
    SELECT
      fp.*,
      u.nickname as author_nickname,
      u.avatar_emoji as author_emoji,
      u.role as author_role,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = fp.id) as comment_count,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = fp.id) as like_count,
      CASE
        WHEN ? IS NULL THEN 0
        ELSE EXISTS(SELECT 1 FROM likes ul WHERE ul.post_id = fp.id AND ul.user_id = ?)
      END as liked_by_user
    FROM filtered_posts fp
    JOIN users u ON fp.author_id = u.id
    ORDER BY fp.created_at DESC
  `;

  bindings.push(limit, offset);
  bindings.push(userId || null, userId || null);

  const stmt = db.prepare(query);
  const result = await stmt.bind(...bindings).all<Post>();
  return result.results || [];
}

export async function getPostById(db: D1Database, id: number, userId?: number): Promise<Post | null> {
  await ensurePerformanceIndexes(db);

  const query = `
    SELECT
      p.*,
      u.nickname as author_nickname,
      u.avatar_emoji as author_emoji,
      u.role as author_role,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
      CASE
        WHEN ? IS NULL THEN 0
        ELSE EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?)
      END as liked_by_user
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `;

  const result = await db.prepare(query).bind(userId || null, userId || null, id).first<Post>();
  return result || null;
}

export async function createPost(
  db: D1Database,
  data: { authorId: number; title: string; content: string; category: string; sportType?: string }
): Promise<number> {
  const result = await db
    .prepare('INSERT INTO posts (author_id, title, content, category, sport_type) VALUES (?, ?, ?, ?, ?)')
    .bind(data.authorId, data.title, data.content, data.category, data.sportType || null)
    .run();
  return result.meta.last_row_id as number;
}

export async function updatePost(
  db: D1Database,
  id: number,
  data: { title: string; content: string; category: string; sportType?: string }
): Promise<void> {
  await db
    .prepare('UPDATE posts SET title = ?, content = ?, category = ?, sport_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(data.title, data.content, data.category, data.sportType || null, id)
    .run();
}

export async function deletePost(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
}

export async function ensureExpandedCategories(db: D1Database): Promise<void> {
  if (!expandedCategoriesPromise) {
    expandedCategoriesPromise = (async () => {
      const table = await db
        .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'posts'")
        .first<{ sql: string }>();

      if (table?.sql?.includes("'music'") && table.sql.includes("'ai'")) {
        return;
      }

      await db.batch([
        db.prepare('PRAGMA defer_foreign_keys = true'),
        db.prepare(`
          CREATE TABLE posts_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          author_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL CHECK(category IN ('gaming', 'movies', 'music', 'ai', 'sports', 'english')),
          sport_type TEXT CHECK(sport_type IN ('basketball', 'badminton', 'marathon', NULL)),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (author_id) REFERENCES users(id)
        )`),
        db.prepare(`
          INSERT INTO posts_new (
            id,
            author_id,
            title,
            content,
            category,
            sport_type,
            created_at,
            updated_at
          )
          SELECT
            id,
            author_id,
            title,
            content,
            category,
            sport_type,
            created_at,
            updated_at
          FROM posts
        `),
        db.prepare('DROP TABLE posts'),
        db.prepare('ALTER TABLE posts_new RENAME TO posts'),
      ]);

      performanceIndexesPromise = null;
      await ensurePerformanceIndexes(db);
    })().catch((error) => {
      expandedCategoriesPromise = null;
      throw error;
    });
  }

  await expandedCategoriesPromise;
}

// ---- Comments ----

export async function getCommentsByPostId(db: D1Database, postId: number): Promise<Comment[]> {
  await ensurePerformanceIndexes(db);

  const result = await db
    .prepare(`
      SELECT c.*, u.nickname as author_nickname, u.avatar_emoji as author_emoji
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `)
    .bind(postId)
    .all<Comment>();
  return result.results || [];
}

export async function getCommentById(db: D1Database, id: number): Promise<CommentWithPostAuthor | null> {
  const result = await db
    .prepare(`
      SELECT c.*, p.author_id as post_author_id
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = ?
    `)
    .bind(id)
    .first<CommentWithPostAuthor>();
  return result || null;
}

export async function createComment(
  db: D1Database,
  data: { postId: number; authorId: number; content: string }
): Promise<number> {
  const result = await db
    .prepare('INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)')
    .bind(data.postId, data.authorId, data.content)
    .run();
  return result.meta.last_row_id as number;
}

export async function deleteComment(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
}

// ---- Likes ----

export async function toggleLike(db: D1Database, postId: number, userId: number): Promise<boolean> {
  await ensurePerformanceIndexes(db);

  const existing = await db
    .prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?')
    .bind(postId, userId)
    .first();

  if (existing) {
    await db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').bind(postId, userId).run();
    return false; // unliked
  } else {
    await db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').bind(postId, userId).run();
    return true; // liked
  }
}

export async function getLikeCount(db: D1Database, postId: number): Promise<number> {
  await ensurePerformanceIndexes(db);

  const result = await db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').bind(postId).first<{ count: number }>();
  return result?.count || 0;
}

// ---- Init / Setup ----

export async function ensurePasswordsSet(db: D1Database, defaultHash: string): Promise<void> {
  // Set default password for users who don't have one yet
  await db
    .prepare("UPDATE users SET password_hash = ? WHERE password_hash IS NULL OR password_hash = ''")
    .bind(defaultHash)
    .run();
}

export async function getPostCount(db: D1Database, authorId?: number): Promise<number> {
  await ensurePerformanceIndexes(db);

  let query = 'SELECT COUNT(*) as count FROM posts';
  if (authorId) {
    query += ' WHERE author_id = ?';
    const result = await db.prepare(query).bind(authorId).first<{ count: number }>();
    return result?.count || 0;
  }
  const result = await db.prepare(query).first<{ count: number }>();
  return result?.count || 0;
}
