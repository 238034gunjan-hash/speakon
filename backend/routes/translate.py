from flask import Blueprint, request, jsonify
from services.translator import (
    get_emergency_message,
    suggest_tourist_reply,
    translate_text,
)

translate_bp = Blueprint("translate", __name__)

@translate_bp.route("/translate", methods=["POST"])
def translate():
    data = request.get_json(silent=True) or {}

    text = data.get("text", "")
    source_lang = data.get("source_lang", "English")
    target_lang = data.get("target_lang", "Nepali")
    mode = data.get("mode", "general")
    mode_title = data.get("mode_title", "General Mode")
    mode_context = data.get("mode_context", "")
    recent_messages = data.get("recent_messages", [])
    emergency_action = data.get("emergency_action")

    if not text.strip():
        return jsonify({"error": "Missing text"}), 400

    if str(mode).strip().lower() == "emergency" and emergency_action:
        text = get_emergency_message(emergency_action, text)

    translated = translate_text(
        text,
        source_lang,
        target_lang,
        mode=mode,
        mode_title=mode_title,
        mode_context=mode_context,
        recent_messages=recent_messages,
    )
    suggestion = suggest_tourist_reply(
        text,
        translated,
        source_lang,
        target_lang,
        mode=mode,
        mode_title=mode_title,
        mode_context=mode_context,
        recent_messages=recent_messages,
    )

    return jsonify({
        "source_text": text,
        "translated_text": translated,
        "suggestion": suggestion,
    })
