CREATE TABLE users (
  PRIMARY KEY (workspace_id),
  workspace_id TEXT NOT NULL,
  admin_id INTEGER NOT NULL,
  access_token TEXT NOT NULL,
  authorization_code TEXT NOT NULL
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  conversation_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  send_date TIMESTAMP NOT NULL,
  close_conversation BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id)
    REFERENCES users (workspace_id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_send_date ON messages (send_date);
