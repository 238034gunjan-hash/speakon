import os

import requests


GROQ_TRANSCRIPTIONS_URL = "https://api.groq.com/openai/v1/audio/transcriptions"


def _get_groq_whisper_key():
    return (
        os.getenv("GROQ_API_WHISPER_KEY")
        
    )


def _language_code(language):
    language_map = {
        "english": "en",
        "nepali": "ne",
    }
    if not language:
        return None
    return language_map.get(language.strip().lower())


def transcribe_audio(audio_file, language=None):
    api_key = _get_groq_whisper_key()
    if not api_key:
        raise RuntimeError("GROQ_API_WHISPER_KEY is not configured")

    model = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")
    filename = audio_file.filename or "recording.webm"
    content_type = audio_file.mimetype or "audio/webm"

    data = {
        "model": model,
        "response_format": "json",
        "temperature": "0",
    }

    language = _language_code(language)
    if language:
        data["language"] = language

    try:
        response = requests.post(
            GROQ_TRANSCRIPTIONS_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            data=data,
            files={"file": (filename, audio_file.stream, content_type)},
            timeout=60,
        )
    except requests.RequestException as error:
        raise RuntimeError(f"Groq transcription request failed: {error}") from error

    if not response.ok:
        raise RuntimeError(f"Groq transcription failed: {response.status_code} {response.text}")

    try:
        result = response.json()
    except ValueError as error:
        raise RuntimeError("Groq transcription returned an invalid JSON response") from error

    return {
        "text": (result.get("text") or "").strip(),
        "language": language,
        "provider": "groq",
        "model": model,
    }
