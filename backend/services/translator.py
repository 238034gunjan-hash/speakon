import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
)


MODE_GUIDANCE = {
    "general": {
        "name": "General Mode",
        "context": (
            "Everyday tourist conversation. Resolve ambiguous words using normal travel "
            "conversation unless recent messages imply a more specific meaning."
        ),
        "hints": [
            "Keep the tone natural, polite, and conversational.",
            "Use simple phrasing that a local person would understand quickly.",
        ],
    },
    "shop": {
        "name": "Shop Mode",
        "context": (
            "Local market, store, pricing, bargaining, checkout, payment, receipts, "
            "product quality, sizes, quantities, and availability."
        ),
        "hints": [
            "Interpret 'change' as money/change/loose cash when the sentence is payment-related.",
            "Interpret 'lower' as reducing price when the sentence is about bargaining.",
            "Prefer friendly market language over formal business wording.",
        ],
    },
    "taxi": {
        "name": "Taxi Mode",
        "context": (
            "Taxi, ride-share, bus, or local transport conversation with drivers or "
            "station staff. Includes directions, fares, pickup/dropoff, waiting, luggage, "
            "routes, timing, and traffic."
        ),
        "hints": [
            "Interpret 'stop', 'wait', 'meter', 'fare', and 'take me' in a transport sense.",
            "Keep location and direction requests short and easy to say aloud.",
            "Prefer direct driver-facing wording.",
        ],
    },
    "hotel": {
        "name": "Hotel Mode",
        "context": (
            "Hotel, guesthouse, hostel, homestay, or reception conversation. Includes "
            "booking, check-in, checkout, rooms, keys, Wi-Fi, breakfast, room service, "
            "cleaning, and facility problems."
        ),
        "hints": [
            "Interpret 'reservation', 'room', 'service', and 'key' in a lodging context.",
            "Use polite guest-to-staff language.",
            "Keep requests clear enough for reception or hotel staff.",
        ],
    },
    "dining": {
        "name": "Dining Mode",
        "context": (
            "Restaurant, cafe, food stall, or bar conversation. Includes menus, ordering, "
            "spice level, vegetarian needs, allergies, water, table service, billing, and "
            "food feedback."
        ),
        "hints": [
            "Interpret 'bill' as the restaurant check.",
            "Interpret 'spicy', 'mild', 'menu', 'table', and 'order' in a food context.",
            "Preserve dietary and allergy meaning exactly.",
        ],
    },
    "emergency": {
        "name": "Emergency Mode",
        "context": (
            "Urgent safety, medical, police, lost-person, or help-seeking conversation."
        ),
        "hints": [
            "Use short, direct, unambiguous sentences.",
            "Do not soften or over-elaborate urgent requests.",
            "Preserve critical details such as location, numbers, symptoms, and danger.",
        ],
    },
}


def _normalize_mode(mode):
    return str(mode or "general").strip().lower()


def _mode_guidance(mode, mode_title=None, mode_context=None):
    guidance = MODE_GUIDANCE.get(_normalize_mode(mode), MODE_GUIDANCE["general"]).copy()
    if mode_title:
        guidance["name"] = str(mode_title).strip()
    if mode_context:
        guidance["context"] = str(mode_context).strip()
    return guidance


def _format_recent_messages(recent_messages):
    if not isinstance(recent_messages, list) or not recent_messages:
        return "No previous conversation context."

    lines = []
    for message in recent_messages[-6:]:
        if not isinstance(message, dict):
            continue
        original = " ".join(str(message.get("original_text") or "").split())
        translated = " ".join(str(message.get("translated_text") or "").split())
        original_language = message.get("original_language") or "source"
        translated_language = message.get("translated_language") or "target"
        if original or translated:
            lines.append(
                f"- {original_language}: {original}\n"
                f"  {translated_language}: {translated}"
            )

    return "\n".join(lines) if lines else "No previous conversation context."


def translate_text(
    text,
    source_lang,
    target_lang,
    mode="general",
    mode_title=None,
    mode_context=None,
    recent_messages=None,
):
    guidance = _mode_guidance(mode, mode_title, mode_context)
    hints = "\n".join(f"- {hint}" for hint in guidance["hints"])
    recent_context = _format_recent_messages(recent_messages)

    system_prompt = f"""
You are SpeakOn's real-time travel translator.

Translate naturally from {source_lang} to {target_lang}.

Active mode: {guidance["name"]}
Mode context: {guidance["context"]}

Mode-specific interpretation hints:
{hints}

Conversation context:
{recent_context}

Rules:
- Use the active mode and recent conversation to resolve ambiguous words.
- Preserve the speaker's intent, politeness, urgency, numbers, names, and locations.
- Prefer common spoken phrasing over literal word-for-word translation.
- If translating to Nepali, write natural conversational Nepali in Devanagari script.
- If translating to English, write clear natural English.
- Return only the translated text. Do not add explanations, labels, quotes, or alternatives.
"""

    response = client.chat.completions.create(
        model="deepseek-chat",
        temperature=0.1,
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"Translate this {guidance['name']} message:\n\n{text}",
            },
        ],
    )

    return response.choices[0].message.content.strip()
