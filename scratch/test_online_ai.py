import requests
import json

url = "https://masar-backend-v72t.onrender.com/api/v1/tutor/ask"
payload = {
    "query": "مرحبا، هل تعمل بشكل صحيح؟",
    "mode": "explain"
}
headers = {
    "Content-Type": "application/json"
}

print(f"Testing AI response on deployed website: {url}")
try:
    response = requests.post(url, json=payload, headers=headers, timeout=20)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        res_data = response.json()
        print("Response JSON (escaped for safety):")
        print(json.dumps(res_data, indent=2, ensure_ascii=True))
    else:
        print(f"Error Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
