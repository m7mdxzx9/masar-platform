import requests

url = "https://openrouter.ai/api/v1/models"
response = requests.get(url)
if response.status_code == 200:
    models = response.json().get("data", [])
    free_models = [m["id"] for m in models if m.get("pricing", {}).get("prompt") == "0" and m.get("pricing", {}).get("completion") == "0"]
    print("Found free models:")
    for m in free_models:
        print(f" - {m}")
else:
    print(f"Failed to fetch models: {response.status_code} - {response.text}")
