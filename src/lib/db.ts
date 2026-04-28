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

  let query = `
    SELECT
      p.*,
      u.nickname as author_nickname,
      u.avatar_emoji as author_emoji,
      u.role as author_role,
      COALESCE(comment_counts.comment_count, 0) as comment_count,
      COALESCE(like_counts.like_count, 0) as like_count,
      ${userId ? 'CASE WHEN user_likes.user_id IS NULL THEN 0 ELSE 1 END as liked_by_user' : '0 as liked_by_user'}
    FROM posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN (
      SELECT post_id, COUNT(*) as comment_count
      FROM comments
      GROUP BY post_id
    ) comment_counts ON comment_counts.post_id = p.id
    LEFT JOIN (
      SELECT post_id, COUNT(*) as like_count
      FROM likes
      GROUP BY post_id
    ) like_counts ON like_counts.post_id = p.id
    ${userId ? 'LEFT JOIN likes user_likes ON user_likes.post_id = p.id AND user_likes.user_id = ?' : ''}
  `;

  const conditions: string[] = [];
  const bindings: any[] = [];

  if (userId) {
    bindings.push(userId);
  }

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

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const stmt = db.prepare(query);
  const result = await stmt.bind(...bindings).all<Post>();
  return result.results || [];
}

export async function getPostById(db: D1Database, id: number, userId?: number): Promise<Post | null> {
  const query = `
    SELECT
      p.*,
      u.nickname as author_nickname,
      u.avatar_emoji as author_emoji,
      u.role as author_role,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count
      ${userId ? `,(SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ${userId}) as liked_by_user` : ',0 as liked_by_user'}
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `;

  const result = await db.prepare(query).bind(id).first<Post>();
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

// ---- Comments ----

export async function getCommentsByPostId(db: D1Database, postId: number): Promise<Comment[]> {
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
  let query = 'SELECT COUNT(*) as count FROM posts';
  if (authorId) {
    query += ' WHERE author_id = ?';
    const result = await db.prepare(query).bind(authorId).first<{ count: number }>();
    return result?.count || 0;
  }
  const result = await db.prepare(query).first<{ count: number }>();
  return result?.count || 0;
}
