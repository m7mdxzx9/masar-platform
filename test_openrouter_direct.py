import requests
import json
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='backend/.env')

api_key = os.getenv("OPENROUTER_API_KEY")
base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "Masar",
}

models_to_test = [
    "openai/gpt-oss-20b:free",
    "liquid/lfm-2.5-1.2b-instruct:free"
]

for model in models_to_test:
    print(f"Testing model: {model}...")
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": "مرحبا، كيف حالك؟ أجب بكلمتين باللغة العربية."}
        ],
        "temperature": 0.5,
        "max_tokens": 50
    }
    try:
        response = requests.post(f"{base_url}/chat/completions", headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            res_data = response.json()
            choices = res_data.get("choices", [])
            if choices:
                content = choices[0]['message'].get('content')
                print(f" -> Response from {model}: {repr(content)}")
            else:
                print(f" -> No choices returned: {res_data}")
        else:
            print(f" -> Failed with status code {response.status_code}: {response.text}")
    except Exception as e:
        print(f" -> Error testing {model}: {e}")
