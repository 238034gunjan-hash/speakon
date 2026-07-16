import asyncio
import os

import edge_tts
from dotenv import load_dotenv


load_dotenv()

DEFAULT_VOICES = {
    "english": os.getenv("TTS_VOICE_ENGLISH", "en-US-AriaNeural"),
    "nepali": os.getenv("TTS_VOICE_NEPALI", "ne-NP-HemkalaNeural"),
}


def _normalize_language(language):
    if not language:
        return "english"
    normalized = str(language).strip().lower()
    if normalized in {"english", "en"}:
        return "english"
    if normalized in {"nepali", "ne", "ne-np"}:
        return "nepali"
    return "english"


async def synthesize_speech(text, language="english"):
    normalized_language = _normalize_language(language)

    if not text or not str(text).strip():
        return b""

    voice = DEFAULT_VOICES.get(normalized_language, DEFAULT_VOICES["english"])
    rate = "-10%"

    for attempt in range(2):
        try:
            communicate = edge_tts.Communicate(str(text).strip(), voice=voice, rate=rate)
            audio_chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_chunks.append(chunk.get("data", b""))
            return b"".join(audio_chunks)
        except Exception as error:
            if attempt == 1:
                raise RuntimeError(f"Text-to-speech synthesis failed: {error}") from error

    raise RuntimeError("Text-to-speech synthesis failed")


def synthesize_speech_sync(text, language="english"):
    if not text or not str(text).strip():
        return b""

    try:
        return asyncio.run(synthesize_speech(text, language))
    except RuntimeError:
        raise
    except Exception as error:
        raise RuntimeError(f"Text-to-speech synthesis failed: {error}") from error
