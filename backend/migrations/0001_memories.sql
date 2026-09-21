CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship_to_zea TEXT NOT NULL,
  story TEXT NOT NULL,
  photo_key TEXT,
  photo_size_bytes INTEGER,
  photo_caption TEXT,
  consent_to_publish INTEGER NOT NULL DEFAULT 0,
  consent_to_contact INTEGER NOT NULL DEFAULT 0,
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS memories_moderation_idx ON memories (moderation_status, created_at);
