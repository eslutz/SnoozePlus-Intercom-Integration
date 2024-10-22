CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id INTEGER NOT NULL,
    conversation_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    send_date TIMESTAMP NOT NULL,
    close_conversation BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_messages_send_date ON messages (send_date);
