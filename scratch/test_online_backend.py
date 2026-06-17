import requests
import json

urls = [
    "https://masar-backend-v72t.onrender.com/health",
    "https://masar-backend.onrender.com/health",
]

for url in urls:
    print(f"Checking URL: {url}")
    try:
        response = requests.get(url, timeout=15)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response:")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        else:
            print(f"Fail Response: {response.text}")
    except Exception as e:
        print(f"Failed to connect: {e}")
    print("-" * 50)
