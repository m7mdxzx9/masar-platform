import urllib.request
import json
import os

key = os.environ.get("OPENROUTER_API_KEY", "")
url = "https://openrouter.ai/api/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "Masar Test"
}

data = {
    "model": "openai/gpt-oss-20b:free",
    "messages": [{"role": "user", "content": "test"}]
}

print("Testing OpenRouter API connection...")
req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10) as response:
        res = json.loads(response.read().decode())
        print("Success! Response:")
        print(json.dumps(res, indent=2, ensure_ascii=False))
except Exception as e:
    print("Failed with exception:", e)
    if hasattr(e, "read"):
        print("Error response content:", e.read().decode())
