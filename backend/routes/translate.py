from flask import Blueprint, request, jsonify
from services.translator import translate_text

translate_bp = Blueprint("translate", __name__)

@translate_bp.route("/translate", methods=["POST"])
def translate():
    data = request.get_json(silent=True) or {}

    text = data.get("text", "")
    source_lang = data.get("source_lang", "English")
    target_lang = data.get("target_lang", "Nepali")

    if not text.strip():
        return jsonify({"error": "Missing text"}), 400

    translated = translate_text(
        text,
        source_lang,
        target_lang
    )

    return jsonify({
        "translated_text": translated
    })