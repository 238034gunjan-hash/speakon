from flask import Blueprint, request, jsonify
from services.translator import translate_text

translate_bp = Blueprint("translate", __name__)

@translate_bp.route("/translate", methods=["POST"])
def translate():

    data = request.json

    text = data.get("text")
    source_lang = data.get("source_lang")
    target_lang = data.get("target_lang")

    translated = translate_text(
        text,
        source_lang,
        target_lang
    )

    return jsonify({
        "translated_text": translated
    })