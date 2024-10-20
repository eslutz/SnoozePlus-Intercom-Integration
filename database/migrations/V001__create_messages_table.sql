CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT NOT NULL,
    admin_id INTEGER NOT NULL,
    conversation_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    send_date DATE NOT NULL
);
