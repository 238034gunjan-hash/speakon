import psycopg2
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from services.conversations import ConversationService


conversation_bp = Blueprint("conversations", __name__)


def _current_user_id():
    return int(get_jwt_identity())


@conversation_bp.route("/conversations", methods=["GET"])
@jwt_required()
def list_conversations():
    try:
        conversations = ConversationService.list_conversations(_current_user_id())
        return jsonify({"conversations": conversations}), 200
    except psycopg2.Error:
        return jsonify({"error": "Failed to load conversations"}), 500


@conversation_bp.route("/conversations", methods=["POST"])
@jwt_required()
def create_conversation():
    data = request.get_json(silent=True) or {}
    source_language = (data.get("source_language") or "").strip()
    target_language = (data.get("target_language") or "").strip()

    if not source_language or not target_language:
        return jsonify({"error": "source_language and target_language are required"}), 400

    try:
        conversation = ConversationService.create_conversation(
            _current_user_id(),
            source_language,
            target_language,
            (data.get("title") or "").strip() or None,
        )
        return jsonify({"conversation": conversation}), 201
    except psycopg2.Error:
        return jsonify({"error": "Failed to create conversation"}), 500


@conversation_bp.route("/conversations/<conversation_id>", methods=["GET"])
@jwt_required()
def get_conversation(conversation_id):
    user_id = _current_user_id()
    try:
        conversation = ConversationService.get_conversation(user_id, conversation_id)
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404

        messages = ConversationService.get_messages(user_id, conversation_id)
        return jsonify({"conversation": conversation, "messages": messages}), 200
    except psycopg2.errors.InvalidTextRepresentation:
        return jsonify({"error": "Invalid conversation id"}), 400
    except psycopg2.Error:
        return jsonify({"error": "Failed to load conversation"}), 500


@conversation_bp.route("/conversations/<conversation_id>", methods=["DELETE"])
@jwt_required()
def delete_conversation(conversation_id):
    try:
        deleted = ConversationService.delete_conversation(_current_user_id(), conversation_id)
        if not deleted:
            return jsonify({"error": "Conversation not found"}), 404
        return jsonify({"message": "Conversation deleted"}), 200
    except psycopg2.errors.InvalidTextRepresentation:
        return jsonify({"error": "Invalid conversation id"}), 400
    except psycopg2.Error:
        return jsonify({"error": "Failed to delete conversation"}), 500


@conversation_bp.route("/messages", methods=["POST"])
@jwt_required()
def create_message():
    data = request.get_json(silent=True) or {}
    required_fields = [
        "conversation_id",
        "sender",
        "original_text",
        "translated_text",
        "original_language",
        "translated_language",
    ]
    missing = [field for field in required_fields if not str(data.get(field) or "").strip()]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    payload = {
        "conversation_id": data["conversation_id"],
        "sender": data["sender"].strip(),
        "original_text": data["original_text"],
        "translated_text": data["translated_text"],
        "original_language": data["original_language"].strip(),
        "translated_language": data["translated_language"].strip(),
        "audio_url": (data.get("audio_url") or None),
    }

    try:
        result = ConversationService.add_message(_current_user_id(), payload)
        if not result:
            return jsonify({"error": "Conversation not found"}), 404
        return jsonify(result), 201
    except psycopg2.errors.InvalidTextRepresentation:
        return jsonify({"error": "Invalid conversation id"}), 400
    except psycopg2.Error:
        return jsonify({"error": "Failed to save message"}), 500
