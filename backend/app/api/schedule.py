from fastapi import APIRouter, HTTPException, Body, UploadFile, File
import logging
import os
import re
import fitz  # PyMuPDF
import io
from app.core.config import settings
from bs4 import BeautifulSoup

router = APIRouter(prefix="/schedule", tags=["schedule"])
logger = logging.getLogger(__name__)

# Suppress extremely verbose pdfminer/pdfplumber debug logs
logging.getLogger("pdfminer").setLevel(logging.WARNING)
logging.getLogger("pdfplumber").setLevel(logging.WARNING)

@router.get("/fetch")
async def fetch_schedule():
    """
    Scrapes the Umm Al-Qura academic portal using credentials from config.
    Currently disabled since SSO is unreachable.
    """
    raise HTTPException(
        status_code=503, 
        detail="بوابة تسجيل الدخول للجامعة غير متاحة حالياً. يرجى استخدام 'رفع ملف' أو 'إضافة مادة' بدلاً من ذلك."
    )


@router.post("/parse-manual")
async def parse_manual_schedule(html_content: str = Body(..., embed=True)):
    """
    Fallback parser that extracts schedule data from raw HTML pasted by the user.
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        courses = []
        
        # Search for any table that might be a schedule
        table = soup.find('table', class_=['table-schedule', 'table-bordered'])
        if not table:
            all_tables = soup.find_all('table')
            for t in all_tables:
                if "اسم" in t.get_text() and "وقت" in t.get_text():
                    table = t
                    break
        
        if not table:
            raise ValueError("لم يتم العثور على جدول محاضرات في النص المزود")
            
        rows = table.find_all('tr')
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 4:
                courses.append({
                    "name": cols[0].get_text(strip=True),
                    "code": cols[1].get_text(strip=True) if len(cols) > 1 else "",
                    "time": cols[2].get_text(strip=True) if len(cols) > 2 else "",
                    "day": cols[3].get_text(strip=True) if len(cols) > 3 else "",
                    "room": cols[4].get_text(strip=True) if len(cols) > 4 else "N/A",
                    "instructor": cols[5].get_text(strip=True) if len(cols) > 5 else "N/A"
                })
        
        return {"courses": courses}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"فشل تحليل النص: {str(e)}")

@router.post("/upload")
async def upload_schedule_file(file: UploadFile = File(...)):
    """
    Uploads a PDF or Image and extracts schedule data.
    Uses PyMuPDF for text extraction, then regex parsing.
    """
    logger.info(f"Received file upload: {file.filename}")
    if not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="يرجى رفع ملف PDF أو صورة فقط")
    
    try:
        content = await file.read()
        logger.info(f"File size: {len(content)} bytes")
        
        text = ""
        
        # ─── Extract text from PDF/Image using PyMuPDF ───
        if file.filename.lower().endswith('.pdf'):
            try:
                doc = fitz.open(stream=content, filetype="pdf")
                for page in doc:
                    text += page.get_text()
                doc.close()
                logger.info(f"PyMuPDF extracted {len(text)} chars from PDF")
            except Exception as e:
                logger.error(f"PyMuPDF error: {e}")
                raise HTTPException(status_code=400, detail="فشل قراءة ملف PDF")
        else:
            # Image file
            try:
                doc = fitz.open(stream=content, filetype=file.filename.split('.')[-1])
                for page in doc:
                    text += page.get_text()
                doc.close()
            except Exception as e:
                logger.error(f"Image processing error: {e}")
                raise HTTPException(status_code=400, detail="فشل قراءة ملف الصورة")

        if not text.strip():
            raise HTTPException(status_code=400, detail="الملف لا يحتوي على نص قابل للقراءة. جرب رفع ملف PDF آخر أو استخدم 'إضافة مادة'.")

        logger.info(f"Raw text preview: {text[:300]}")
        
        # ─── Parse courses from extracted text ───
        courses_data = []
        
        # Strategy 1: Look for time-based pattern (UQU schedule format)
        # Pattern: time -> name -> :الرقم code -> ... -> :القاعة room
        lines = text.splitlines()
        lines = [l.strip() for l in lines if l.strip()]  # clean empty lines
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Match time pattern like "08:00- 08:50" or "10:00 - 10:50"
            time_match = re.match(r'(\d{1,2}:\d{2})\s*-?\s*(\d{1,2}:\d{2})', line)
            if time_match:
                time_val = f"{time_match.group(1)} - {time_match.group(2)}"
                i += 1
                
                # Collect name lines until we hit a code marker
                name_parts = []
                code = ""
                room = ""
                instructor = ""
                
                while i < len(lines):
                    cl = lines[i]
                    
                    # Check for code marker
                    if ":الرقم" in cl or "الرقم:" in cl:
                        code = cl.replace(":الرقم", "").replace("الرقم:", "").strip()
                        if not code and i + 1 < len(lines):
                            i += 1
                            code = lines[i].strip()
                        i += 1
                        break
                    
                    # Check if it's a new time (we've gone too far)
                    if re.match(r'\d{1,2}:\d{2}\s*-?\s*\d{1,2}:\d{2}', cl):
                        break
                    
                    name_parts.append(cl)
                    i += 1
                
                # Now look for room and other details until next time slot
                while i < len(lines):
                    cl = lines[i]
                    
                    if re.match(r'\d{1,2}:\d{2}\s*-?\s*\d{1,2}:\d{2}', cl):
                        break
                    
                    if ":القاعة" in cl or "القاعة:" in cl:
                        room = cl.replace(":القاعة", "").replace("القاعة:", "").strip()
                        if not room and i + 1 < len(lines):
                            i += 1
                            room = lines[i].strip()
                    
                    if ":المحاضر" in cl or "المحاضر:" in cl:
                        instructor = cl.replace(":المحاضر", "").replace("المحاضر:", "").strip()
                        if not instructor and i + 1 < len(lines):
                            i += 1
                            instructor = lines[i].strip()
                    
                    i += 1
                
                # Build course name, cleaning out noise
                raw_name = " ".join(name_parts)
                # Remove any embedded time patterns
                clean_name = re.sub(r'\d{1,2}:\d{2}\s*-?\s*\d{1,2}:\d{2}', '', raw_name).strip()
                # Remove common noise words
                for noise in [":النشاط", "النشاط:", ":الشعبة", "الشعبة:", ":المقر", "المقر:", "نظري", "عملي"]:
                    clean_name = clean_name.replace(noise, "")
                clean_name = " ".join(clean_name.split())  # normalize whitespace
                
                if code and clean_name:
                    courses_data.append({
                        "name": clean_name,
                        "code": code,
                        "time": time_val,
                        "day": "غير محدد",
                        "room": room or "N/A",
                        "instructor": instructor or "N/A"
                    })
            else:
                i += 1
        
        # Strategy 2: If no time-based courses found, try a more general approach
        if not courses_data:
            # Look for course code patterns (e.g. CEN2011, MATH101, etc.)
            code_pattern = re.compile(r'[A-Z]{2,4}\d{3,4}')
            found_codes = code_pattern.findall(text)
            
            if found_codes:
                for code in set(found_codes):
                    # Try to find the course name near the code
                    idx = text.find(code)
                    context = text[max(0, idx-100):idx+100]
                    # Get Arabic text near the code
                    arabic_parts = re.findall(r'[\u0600-\u06FF\s]+', context)
                    name = " ".join([p.strip() for p in arabic_parts if len(p.strip()) > 3])
                    
                    if name:
                        courses_data.append({
                            "name": name[:50],
                            "code": code,
                            "time": "",
                            "day": "غير محدد",
                            "room": "N/A",
                            "instructor": "N/A"
                        })
        
        if courses_data:
            # Deduplicate by code
            seen = set()
            unique_courses = []
            for c in courses_data:
                key = f"{c['code']}_{c['time']}"
                if key not in seen:
                    seen.add(key)
                    unique_courses.append(c)
            
            logger.info(f"Successfully parsed {len(unique_courses)} courses from PDF")
            return {"courses": unique_courses}
        else:
            raise ValueError("لم يتم العثور على مواد في الملف. يرجى التأكد من أن الملف يحتوي على جدول دراسي واضح، أو استخدم زر 'إضافة مادة' لإضافتها يدوياً.")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File parse error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"فشل معالجة الملف: {str(e)}")
