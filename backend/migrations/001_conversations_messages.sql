CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_language VARCHAR(50) NOT NULL,
    target_language VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    original_language VARCHAR(50) NOT NULL,
    translated_language VARCHAR(50) NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS conversations_user_id_idx
ON conversations (user_id);

CREATE INDEX IF NOT EXISTS conversations_created_at_idx
ON conversations (created_at DESC);

CREATE INDEX IF NOT EXISTS conversations_updated_at_idx
ON conversations (updated_at DESC);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx
ON messages (conversation_id);

CREATE INDEX IF NOT EXISTS messages_created_at_idx
ON messages (created_at);
