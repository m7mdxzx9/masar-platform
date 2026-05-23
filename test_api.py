import requests
import json
url = 'http://localhost:8000/api/v1/schedule/parse-manual'
html = '''<table class="table-bordered">
<tr><td>رياضيات</td><td>MATH101</td><td>10:00</td><td>الأحد</td><td>قاعة 1</td><td>د. أحمد</td></tr>
</table>'''
response = requests.post(url, json={'html_content': html})
print(response.status_code)
print(response.text)
