import requests
import json
import time

url = "http://127.0.0.1:8000/api/v1/labs/run"
payload = {
    "code": "print('Hello from Local Sandbox!')\nimport numpy as np\nprint('Numpy array:', np.array([1,2,3]))\n",
    "language": "python"
}
headers = {
    "Content-Type": "application/json"
}

# Wait for server to be fully ready
time.sleep(2)

print(f"Testing local python code execution on: {url}")
try:
    response = requests.post(url, json=payload, headers=headers, timeout=10)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        res_data = response.json()
        print("Response JSON:")
        print(json.dumps(res_data, indent=2))
    else:
        print(f"Error Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
