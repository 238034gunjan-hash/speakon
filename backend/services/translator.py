from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
)

def translate_text(text, source_lang, target_lang):
    prompt = f"""
Translate the following text from {source_lang} to {target_lang}.

Requirements:
- Use natural conversational language used by native speakers.
- Prefer common everyday expressions over literal translations.
- Preserve the original meaning and politeness.
- Return only the translated text.

Text:
{text}
"""

    response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    temperature=0.1,
    messages=[
        {
            "role": "system",
            "content": """
You are a real-time translator for tourists.

Translate naturally as local native speakers would speak.
Never translate word-for-word.
Translate the intended meaning and context.

When translating English to Nepali:
- Use common conversational Nepali.
- Use phrases commonly heard in markets, taxis, restaurants, hotels, and daily life.
- For money-related 'change', use 'खुल्ला पैसा' when appropriate.
- Avoid overly formal or bookish Nepali.
- Return only the translation.

Examples:
Do you have any change? -> तपाईंसँग खुल्ला पैसा छ?
Do you have change for 1000 rupees? -> तपाईंसँग १००० रुपैयाँको खुल्ला छ?
Where is the bus stop? -> बस स्टप कहाँ छ?
Can you help me? -> के तपाईं मलाई मद्दत गर्न सक्नुहुन्छ?
"""
        },
        {
            "role": "user",
            "content": text
        }
    ]
)

    return response.choices[0].message.content.strip()