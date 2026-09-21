ALTER TABLE memories ADD COLUMN moderation_note TEXT;
ALTER TABLE memories ADD COLUMN moderated_at TEXT;
ALTER TABLE memories ADD COLUMN moderated_by TEXT;
ALTER TABLE memories ADD COLUMN updated_at TEXT;

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON audit_events (entity_type, entity_id, created_at);
