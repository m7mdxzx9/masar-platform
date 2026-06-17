import os
import requests
import time
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

models = [
    "deepseek/deepseek-v4-flash:free",
    "google/gemma-4-31b-it:free",
    "qwen/qwen3-coder:free"
]

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

print("Measuring models response latency...")
for model in models:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Explain neural network in one short sentence."}],
        "max_tokens": 50
    }
    start = time.time()
    try:
        response = requests.post(f"{BASE_URL}/chat/completions", headers=headers, json=payload, timeout=12)
        latency = time.time() - start
        if response.status_code == 200:
            content = response.json()['choices'][0]['message']['content'].strip()
            print(f" [+] SUCCESS for {model} (Latency: {latency:.2f}s): {content}")
        else:
            print(f" [-] FAILED for {model} (status {response.status_code}): {response.text.strip()}")
    except Exception as e:
        print(f" [-] EXCEPTION for {model}: {e}")
