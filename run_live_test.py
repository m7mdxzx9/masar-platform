import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

# Attempt to reconfigure stdout for UTF-8 if supported
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def test_ai_agent():
    print("=========================================")
    print("RUNNING TEST 1: AI Agent (Tutor Ask)")
    print("=========================================")
    url = f"{BASE_URL}/api/v1/tutor/ask"
    payload = {
        "query": "ما هي المتغيرات في بايثون؟",
        "mode": "explain"
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            res_data = response.json()
            # Save to temp file
            with open("agent_response.json", "w", encoding="utf-8") as f:
                json.dump(res_data, f, indent=2, ensure_ascii=False)
            
            # Print with ASCII escapes to avoid console crash, and also print plain text safely
            print("Response JSON (escaped for safety):")
            print(json.dumps(res_data, indent=2, ensure_ascii=True))
            print("Successfully saved unescaped JSON to agent_response.json")
        else:
            print(f"Error Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

def test_study_assistant():
    print("\n=========================================")
    print("RUNNING TEST 2: Study Assistant File Upload")
    print("=========================================")
    url = f"{BASE_URL}/api/v1/study/study-assistant"
    params = {
        "difficulty": "medium",
        "question_count": 3
    }
    
    try:
        with open("test_lecture.txt", "rb") as f:
            files = {
                "file": ("test_lecture.txt", f, "text/plain")
            }
            response = requests.post(url, params=params, files=files)
            
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            res_data = response.json()
            # Save to temp file
            with open("study_assistant_response.json", "w", encoding="utf-8") as f:
                json.dump(res_data, f, indent=2, ensure_ascii=False)
                
            print("Response JSON (escaped for safety):")
            print(json.dumps(res_data, indent=2, ensure_ascii=True))
            print("Successfully saved unescaped JSON to study_assistant_response.json")
        else:
            print(f"Error Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_ai_agent()
    test_study_assistant()
