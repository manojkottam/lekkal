-- Lekkal email capture schema for Cloudflare D1
-- Run: wrangler d1 execute lekkal-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  user_agent TEXT,
  ip_country TEXT,
  created_at INTEGER NOT NULL,
  unsubscribed INTEGER DEFAULT 0,
  unsubscribed_at INTEGER,
  unsubscribe_token TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at);
CREATE INDEX IF NOT EXISTS idx_subscribers_source ON subscribers(source);
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribed ON subscribers(unsubscribed);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
