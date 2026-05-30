import requests

url = "https://masar-backend-v72t.onrender.com/api/v1/labs/challenges"
try:
    response = requests.get(url)
    print("Status Code:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except Exception:
        print("Response Text:", response.text[:200])
except Exception as e:
    print("Failed to connect to production server:", e)
