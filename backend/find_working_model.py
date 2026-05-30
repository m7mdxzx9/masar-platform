import os
import requests
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

API_KEY = settings.openrouter_api_key
BASE_URL = settings.openrouter_base_url

# We will try a few popular free models
TEST_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "qwen/qwen3-coder:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "minimax/minimax-m2.5:free"
]

print("Scanning for a working free model on OpenRouter...")
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

working_model = None

for model in TEST_MODELS:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 10
    }
    try:
        response = requests.post(f"{BASE_URL}/chat/completions", headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            print(f" [+] Found working model: {model}")
            working_model = model
            break
        else:
            print(f" [-] Model {model} failed with status {response.status_code}: {response.text.strip()}")
    except Exception as e:
        print(f" [-] Model {model} raised exception: {e}")

if working_model:
    print(f"SUCCESS: Use model {working_model}")
else:
    print("FAILED: All tested models failed.")
