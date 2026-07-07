import uuid

import psycopg2
from psycopg2.extras import RealDictCursor

from db import get_connection


def _serialize_row(row):
    if not row:
        return None

    serialized = dict(row)
    for key, value in serialized.items():
        if isinstance(value, uuid.UUID):
            serialized[key] = str(value)
        elif hasattr(value, "isoformat"):
            serialized[key] = value.isoformat()
    return serialized


def _default_title(source_language, target_language):
    return f"{source_language} <-> {target_language}"


def _title_from_text(text, source_language, target_language):
    clean_text = " ".join((text or "").split())
    if not clean_text:
        return _default_title(source_language, target_language)

    return clean_text[:57] + "..." if len(clean_text) > 60 else clean_text


class ConversationService:
    @staticmethod
    def list_conversations(user_id):
        with get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT c.id,
                           c.title,
                           c.source_language,
                           c.target_language,
                           c.created_at,
                           c.updated_at,
                           COUNT(m.id) AS message_count,
                           MAX(m.created_at) AS last_message_at
                    FROM conversations c
                    LEFT JOIN messages m ON m.conversation_id = c.id
                    WHERE c.user_id = %s
                    GROUP BY c.id
                    ORDER BY c.updated_at DESC, c.created_at DESC
                    """,
                    (user_id,),
                )
                return [_serialize_row(row) for row in cursor.fetchall()]

    @staticmethod
    def create_conversation(user_id, source_language, target_language, title=None):
        title = title or _default_title(source_language, target_language)
        with get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    INSERT INTO conversations (user_id, title, source_language, target_language)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, title, source_language, target_language, created_at, updated_at
                    """,
                    (user_id, title, source_language, target_language),
                )
                return _serialize_row(cursor.fetchone())

    @staticmethod
    def get_conversation(user_id, conversation_id):
        with get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT id, title, source_language, target_language, created_at, updated_at
                    FROM conversations
                    WHERE id = %s AND user_id = %s
                    """,
                    (conversation_id, user_id),
                )
                return _serialize_row(cursor.fetchone())

    @staticmethod
    def get_messages(user_id, conversation_id):
        with get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT m.id,
                           m.conversation_id,
                           m.sender,
                           m.original_text,
                           m.translated_text,
                           m.original_language,
                           m.translated_language,
                           m.audio_url,
                           m.suggested_reply,
                           m.suggested_translation,
                           m.suggested_reply_language,
                           m.suggested_translation_language,
                           m.suggestion_reason,
                           m.created_at
                    FROM messages m
                    JOIN conversations c ON c.id = m.conversation_id
                    WHERE c.id = %s AND c.user_id = %s
                    ORDER BY m.created_at ASC
                    """,
                    (conversation_id, user_id),
                )
                return [_serialize_row(row) for row in cursor.fetchall()]

    @staticmethod
    def delete_conversation(user_id, conversation_id):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM conversations WHERE id = %s AND user_id = %s RETURNING id",
                    (conversation_id, user_id),
                )
                return cursor.fetchone() is not None

    @staticmethod
    def add_message(user_id, payload):
        conversation_id = payload["conversation_id"]
        original_text = payload["original_text"].strip()
        translated_text = payload["translated_text"].strip()

        with get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT id, title, source_language, target_language
                    FROM conversations
                    WHERE id = %s AND user_id = %s
                    """,
                    (conversation_id, user_id),
                )
                conversation = cursor.fetchone()
                if not conversation:
                    return None

                cursor.execute(
                    """
                    INSERT INTO messages (
                        conversation_id,
                        sender,
                        original_text,
                        translated_text,
                        original_language,
                        translated_language,
                        audio_url,
                        suggested_reply,
                        suggested_translation,
                        suggested_reply_language,
                        suggested_translation_language,
                        suggestion_reason
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id,
                              conversation_id,
                              sender,
                              original_text,
                              translated_text,
                              original_language,
                              translated_language,
                              audio_url,
                              suggested_reply,
                              suggested_translation,
                              suggested_reply_language,
                              suggested_translation_language,
                              suggestion_reason,
                              created_at
                    """,
                    (
                        conversation_id,
                        payload["sender"],
                        original_text,
                        translated_text,
                        payload["original_language"],
                        payload["translated_language"],
                        payload.get("audio_url"),
                        payload.get("suggested_reply"),
                        payload.get("suggested_translation"),
                        payload.get("suggested_reply_language"),
                        payload.get("suggested_translation_language"),
                        payload.get("suggestion_reason"),
                    ),
                )
                message = _serialize_row(cursor.fetchone())

                cursor.execute(
                    "SELECT COUNT(*) FROM messages WHERE conversation_id = %s",
                    (conversation_id,),
                )
                message_count = cursor.fetchone()["count"]
                title = conversation["title"]
                if message_count == 1:
                    title = _title_from_text(
                        translated_text or original_text,
                        payload["original_language"],
                        payload["translated_language"],
                    )

                cursor.execute(
                    """
                    UPDATE conversations
                    SET title = %s,
                        source_language = %s,
                        target_language = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND user_id = %s
                    RETURNING id, title, source_language, target_language, created_at, updated_at
                    """,
                    (
                        title,
                        payload["original_language"],
                        payload["translated_language"],
                        conversation_id,
                        user_id,
                    ),
                )
                conversation = _serialize_row(cursor.fetchone())

        return {"message": message, "conversation": conversation}
