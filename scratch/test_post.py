import requests

url_status = "https://masar-backend-v72t.onrender.com/api/v1/drive/status"
headers = {
    "Origin": "https://masar-frontend-nsdo.onrender.com",
}

print("Sending GET to /status...")
res_get = requests.get(url_status, headers=headers)
print("GET Status:", res_get.status_code)
print("GET Response:", res_get.text)
print("GET Headers:")
for k, v in res_get.headers.items():
    print(f"  {k}: {v}")
