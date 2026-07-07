from flask import Blueprint, jsonify, request

from services.groq_whisper import transcribe_audio


transcribe_bp = Blueprint("transcribe", __name__)


@transcribe_bp.route("/transcribe", methods=["POST"])
def transcribe():
    audio_file = request.files.get("audio") or request.files.get("file")

    if audio_file is None or not audio_file.filename:
        return jsonify({"error": "Missing audio file"}), 400

    try:
        result = transcribe_audio(audio_file, request.form.get("language"))
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 502

    if not result["text"]:
        return jsonify({"error": "No transcript returned"}), 422

    return jsonify(result)
