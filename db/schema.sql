-- 奉天F4Club Database Schema

-- Users table (4 fixed members)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('programmer', 'artist')),
  password_hash TEXT NOT NULL DEFAULT '',
  avatar_emoji TEXT DEFAULT '👤',
  custom_avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('gaming', 'movies', 'music', 'ai', 'sports', 'english')),
  sport_type TEXT CHECK(sport_type IN ('basketball', 'badminton', 'marathon', NULL)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category_created_at ON posts(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_created_at ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created_at ON comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id);

-- Seed initial users with pre-computed password hash for '123456'
-- Hash = SHA-256('f4club-2026-fengtian' + '123456')
INSERT OR IGNORE INTO users (nickname, role, avatar_emoji, password_hash) VALUES
  ('佛', 'programmer', '🧘', '961e59d975861728c40449c1abea338f94c8cb991e21e563531b8d4deabef368'),
  ('猛将', 'programmer', '⚔️', '961e59d975861728c40449c1abea338f94c8cb991e21e563531b8d4deabef368'),
  ('陈少', 'programmer', '🎯', '961e59d975861728c40449c1abea338f94c8cb991e21e563531b8d4deabef368'),
  ('大壮', 'artist', '🎨', '961e59d975861728c40449c1abea338f94c8cb991e21e563531b8d4deabef368');
