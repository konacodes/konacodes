-- Blog posts table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  published INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- Create index for listing published posts
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published, created_at DESC);
