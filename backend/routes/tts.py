from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from services.tts import synthesize_speech_sync


tts_bp = Blueprint("tts", __name__)


@tts_bp.route("/tts", methods=["POST"])
@jwt_required()
def generate_tts():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    language = data.get("language", "english")

    if not str(text).strip():
        return jsonify({"error": "Missing text"}), 400

    try:
        audio_bytes = synthesize_speech_sync(text, language)
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 500

    if not audio_bytes:
        return jsonify({"error": "No audio generated"}), 500

    return (audio_bytes, 200, {"Content-Type": "audio/mpeg"})
