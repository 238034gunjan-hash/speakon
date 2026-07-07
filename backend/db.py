import os
import psycopg2
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured")

    return psycopg2.connect(DATABASE_URL, connect_timeout=10)


def init_db():
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255),
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    google_id VARCHAR(255) UNIQUE,
                    profile_picture VARCHAR(500),
                    is_google_user BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            cursor.execute(
                """
                ALTER TABLE users
                    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
                    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
                    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500),
                    ADD COLUMN IF NOT EXISTS is_google_user BOOLEAN NOT NULL DEFAULT FALSE,
                    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                """
            )
            cursor.execute(
                """
                UPDATE users
                SET password_hash = password
                WHERE password_hash IS NULL
                  AND password IS NOT NULL
                  AND password LIKE '$2%'
                """
            )
            cursor.execute(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
                ON users (LOWER(email))
                WHERE email IS NOT NULL
                """
            )
            cursor.execute(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique
                ON users (google_id)
                WHERE google_id IS NOT NULL
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS translations (
                    id SERIAL PRIMARY KEY,
                    input_text TEXT,
                    translated_text TEXT,
                    source_language VARCHAR(50),
                    target_language VARCHAR(50),
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            cursor.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS conversations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    source_language VARCHAR(50) NOT NULL,
                    target_language VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                    sender VARCHAR(50) NOT NULL,
                    original_text TEXT NOT NULL,
                    translated_text TEXT NOT NULL,
                    original_language VARCHAR(50) NOT NULL,
                    translated_language VARCHAR(50) NOT NULL,
                    audio_url TEXT,
                    suggested_reply TEXT,
                    suggested_translation TEXT,
                    suggested_reply_language VARCHAR(50),
                    suggested_translation_language VARCHAR(50),
                    suggestion_reason TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            cursor.execute(
                """
                ALTER TABLE messages
                    ADD COLUMN IF NOT EXISTS suggested_reply TEXT,
                    ADD COLUMN IF NOT EXISTS suggested_translation TEXT,
                    ADD COLUMN IF NOT EXISTS suggested_reply_language VARCHAR(50),
                    ADD COLUMN IF NOT EXISTS suggested_translation_language VARCHAR(50),
                    ADD COLUMN IF NOT EXISTS suggestion_reason TEXT
                """
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations (user_id)"
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations (created_at DESC)"
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations (updated_at DESC)"
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages (conversation_id)"
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at)"
            )
