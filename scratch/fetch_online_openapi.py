import requests
import json

url = "https://masar-backend-v72t.onrender.com/openapi.json"
print(f"Fetching OpenAPI spec from: {url}")
try:
    response = requests.get(url, timeout=10)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        spec = response.json()
        print("Paths available in deployed backend:")
        for path in sorted(spec.get("paths", {}).keys()):
            print(f"  {path}")
    else:
        print(f"Error Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
