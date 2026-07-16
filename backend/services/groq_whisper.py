import os

import requests


GROQ_TRANSCRIPTIONS_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

# Nudges spelling/recognition toward common tourism terms. Override via env if needed.
DEFAULT_PROMPT = os.getenv(
    "GROQ_WHISPER_PROMPT",
    "Nepal tourism conversation. Terms: Thamel, Pokhara, Kathmandu, namaste, "
    "rupees, dal bhat, momo, trekking, Everest, guesthouse.",
)


def _get_groq_whisper_key():
    return os.getenv("GROQ_API_WHISPER_KEY")


def _language_code(language):
    language_map = {
        "english": "en",
        "nepali": "ne",
    }
    if not language:
        return None
    return language_map.get(language.strip().lower())


def _is_all_noise(segments, threshold=0.6):
    """True if every segment is almost certainly non-speech (background noise)."""
    return bool(segments) and all(
        seg.get("no_speech_prob", 0) > threshold for seg in segments
    )


def transcribe_audio(audio_file, language=None):
    api_key = _get_groq_whisper_key()
    if not api_key:
        raise RuntimeError("GROQ_API_WHISPER_KEY is not configured")

    # Full large-v3, not turbo — turbo is weaker on Nepali.
    model = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3")
    filename = audio_file.filename or "recording.webm"
    content_type = audio_file.mimetype or "audio/webm"

    # Default to English (the app's main language) so we NEVER fall back to
    # auto-detection, which was the source of the misdetection problem.
    lang = _language_code(language) or "en"

    data = {
        "model": model,
        "response_format": "verbose_json",  # gives per-segment no_speech_prob
        "temperature": "0",
        "language": lang,
        "prompt": DEFAULT_PROMPT,
    }

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
        raise RuntimeError(
            f"Groq transcription failed: {response.status_code} {response.text}"
        )

    try:
        result = response.json()
    except ValueError as error:
        raise RuntimeError(
            "Groq transcription returned an invalid JSON response"
        ) from error

    segments = result.get("segments", [])
    text = (result.get("text") or "").strip()

    # Drop clips that are just background noise/silence instead of returning junk.
    if _is_all_noise(segments):
        text = ""

    return {
        "text": text,
        "language": lang,
        "provider": "groq",
        "model": model,
    }