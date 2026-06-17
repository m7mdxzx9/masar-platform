import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

models = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemma-4-26b-a4b-it:free",
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    "moonshotai/kimi-k2.6:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "poolside/laguna-xs.2:free"
]

print("Testing free OpenRouter models...")
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

for model in models:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Hello, write 'OK' if you read this."}],
        "max_tokens": 10
    }
    try:
        response = requests.post(f"{BASE_URL}/chat/completions", headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            print(f" [+] SUCCESS for {model}: {response.json()['choices'][0]['message']['content'].strip()}")
        else:
            print(f" [-] FAILED for {model} (status {response.status_code}): {response.text.strip()}")
    except Exception as e:
        print(f" [-] EXCEPTION for {model}: {e}")
