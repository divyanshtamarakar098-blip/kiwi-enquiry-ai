import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
key = os.getenv("GEMINI_API_KEY", "")
print("Key length:", len(key))
print("Starts with:", key[:4])
print("Has spaces or quotes:", any(c in key for c in " \"'"))

client = genai.Client(api_key=key)

for model in ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]:
    print("\n--- Testing", model, "---")
    try:
        r = client.models.generate_content(model=model, contents="Reply with the word OK")
        print("TEXT:", r.text)
        r = client.models.generate_content(
            model=model,
            contents='Return {"ok": true} as JSON',
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        print("JSON:", r.text)
    except Exception as e:
        print("ERROR:", type(e).__name__, str(e)[:300])