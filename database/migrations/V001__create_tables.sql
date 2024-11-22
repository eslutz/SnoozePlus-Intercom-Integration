CREATE TABLE users (
  id INTEGER PRIMARY KEY NOT NULL,
  account_type TEXT NOT NULL,
  access_token TEXT NOT NULL,
  authorization_code TEXT NOT NULL
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id INTEGER NOT NULL,
  conversation_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  send_date TIMESTAMP NOT NULL,
  close_conversation BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_admin_id FOREIGN KEY (admin_id)
  REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_send_date ON messages (send_date);
