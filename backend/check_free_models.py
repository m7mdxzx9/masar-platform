import requests
import json

response = requests.get("https://openrouter.ai/api/v1/models")
if response.status_code == 200:
    models = response.json().get("data", [])
    free_models = [m["id"] for m in models if m["id"].endswith(":free")]
    print("Found free models:")
    for fm in sorted(free_models):
        print(f" - {fm}")
else:
    print("Failed to fetch models:", response.status_code, response.text)
