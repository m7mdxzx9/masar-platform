import requests
import glob
import os

# Find the first PDF in Downloads
pdfs = glob.glob(r"C:\Users\HP\Downloads\*.pdf")
if pdfs:
    pdf_path = pdfs[0]
    print(f"Using: {pdf_path}")
    print(f"Size: {os.path.getsize(pdf_path)} bytes")
    
    with open(pdf_path, 'rb') as f:
        r = requests.post(
            'http://localhost:8000/api/v1/schedule/upload',
            files={'file': ('schedule.pdf', f, 'application/pdf')}
        )
    
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text[:3000]}")
else:
    print("No PDFs found!")
