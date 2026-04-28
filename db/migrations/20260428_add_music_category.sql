-- Add the music category to the posts CHECK constraint.
PRAGMA foreign_keys = OFF;

CREATE TABLE posts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('gaming', 'movies', 'music', 'sports', 'english')),
  sport_type TEXT CHECK(sport_type IN ('basketball', 'badminton', 'marathon', NULL)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

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
FROM posts;

DROP TABLE posts;
ALTER TABLE posts_new RENAME TO posts;

PRAGMA foreign_keys = ON;
