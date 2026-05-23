import requests

url = 'http://localhost:8000/api/v1/schedule/upload'
file_path = r'c:\Users\HP\Downloads\ai\جامعة أم القرى __ البوابة الإلكترونية للنظام الأكاديمي_ البوابة الاكاديمية.pdf'

with open(file_path, 'rb') as f:
    files = {'file': (file_path.split('\\')[-1], f, 'application/pdf')}
    response = requests.post(url, files=files)

print("Status:", response.status_code)
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
print("Response:", response.text)
