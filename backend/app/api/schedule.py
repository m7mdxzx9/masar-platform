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

def is_standalone_word(word: str, text: str) -> bool:
    pattern = r'(?<![\u0600-\u06FF])' + re.escape(word) + r'(?![\u0600-\u06FF])'
    return bool(re.search(pattern, text))

def clean_arabic_text(text: str) -> str:
    # UQU schedules can have reversed Arabic strings because of RTL issues.
    words = text.strip().split()
    corrections = {
        "وتكامل تفاضل": "تفاضل وتكامل",
        "المنطقي التصميم": "التصميم المنطقي",
        "الرقمي التصميم": "التصميم الرقمي",
        "الشيئية الربمجة": "البرمجة الشيئية",
        "الربمجة الشيئية": "البرمجة الشيئية",
        "بايثون بلغة": "بلغة بايثون",
        "اإلنجلزيية": "الإنجليزية",
        "اللغة اإلنجلزيية": "اللغة الإنجليزية",
        "متقطعة هياكل": "هياكل متقطعة",
        "الكريم القرآن": "القرآن الكريم",
        "تجويد القرآن الكريم": "تجويد القرآن الكريم",
    }
    
    full_str = " ".join(words)
    for k, v in corrections.items():
        full_str = full_str.replace(k, v)
        
    full_str = full_str.replace("اإلنجلزيية", "الإنجليزية")
    full_str = full_str.replace("الربمجة", "البرمجة")
    full_str = full_str.replace("التفاصيل", "")
    return full_str.strip()

def parse_uqu_pdf_stream(doc) -> list:
    parsed_courses = []
    
    # Day columns bounds
    day_columns = {
        "Thursday": (45, 140),
        "Wednesday": (140, 225),
        "Tuesday": (225, 310),
        "Monday": (310, 395),
        "Sunday": (395, 480)
    }
    
    arabic_days = {
        "Sunday": "الأحد",
        "Monday": "الاثنين",
        "Tuesday": "الثلاثاء",
        "Wednesday": "الأربعاء",
        "Thursday": "الخميس"
    }

    for page_idx, page in enumerate(doc):
        words = page.get_text("words")
        
        # Find header Y on this page to prevent weekday headers from leaking
        weekday_ys = [w[1] for w in words if w[4] in ["الأحد", "الاثنين", "الثلاثاء", "الثالثاء", "الأربعاء", "الربعاء", "الخميس"]]
        header_y = min(weekday_ys) if weekday_ys else 0
        
        # 1. Find all time slots and their y-coordinates on this page
        time_slots = []
        for w in words:
            text = w[4]
            if re.match(r'^\d{2}:\d{2}', text):
                time_slots.append(w)
                
        # Group time slots by y coordinate
        y_groups = {}
        for w in time_slots:
            y = round(w[1], 1)
            found = False
            for gy in y_groups:
                if abs(gy - y) < 5:
                    y_groups[gy].append(w)
                    found = True
                    break
            if not found:
                y_groups[y] = [w]
                
        # For each y group, get the time range text
        time_slots_on_page = []
        for y, ws in y_groups.items():
            # Get words on the same row that form the time slot
            time_text_parts = [w for w in words if abs(w[1] - y) < 5 and w[0] > 465]
            time_text_parts.sort(key=lambda w: w[0], reverse=True) # RTL
            time_str = " ".join([w[4] for w in time_text_parts]).strip()
            
            times_found = re.findall(r'\d{2}:\d{2}', time_str)
            if len(times_found) == 2:
                time_val = f"{times_found[1]} - {times_found[0]}"
            elif len(times_found) == 1:
                time_val = times_found[0]
            else:
                time_val = time_str
                
            time_slots_on_page.append({
                "y": y,
                "time": time_val
            })
            
        time_slots_on_page.sort(key=lambda r: r["y"])
        
        # 2. Find all course codes on this page
        course_codes = []
        for w in words:
            text = w[4]
            if re.match(r'^[A-Z]{2,4}\d{3,4}$', text):
                course_codes.append(w)
                
        # 3. For each course code, find its cell and details
        for code_word in course_codes:
            x_center = (code_word[0] + code_word[2]) / 2
            y_code = code_word[1]
            code_text = code_word[4]
            
            # Determine day column
            matched_day = None
            for day_name, (x_min, x_max) in day_columns.items():
                if x_min <= x_center <= x_max:
                    matched_day = day_name
                    break
            if not matched_day:
                continue
                
            # Determine closest time slot
            closest_slot = None
            min_dist = float('inf')
            for slot in time_slots_on_page:
                dist = abs(slot["y"] - y_code)
                if dist < min_dist:
                    min_dist = dist
                    closest_slot = slot
            if not closest_slot:
                continue
                
            # Gather all words in cell (y_code - 55 to y_code + 85)
            x_min, x_max = day_columns[matched_day]
            cell_words = []
            for w in words:
                w_center = (w[0] + w[2]) / 2
                if (x_min <= w_center <= x_max) and (y_code - 55 <= w[1] <= y_code + 85) and w[1] > header_y + 10:
                    cell_words.append(w)
                    
            # Group cell words by line
            lines_dict = {}
            for cw in cell_words:
                cy = round(cw[1], 1)
                found = False
                for l_y in lines_dict:
                    if abs(l_y - cy) < 3:
                        lines_dict[l_y].append(cw)
                        found = True
                        break
                if not found:
                    lines_dict[cy] = [cw]
                    
            sorted_lines_y = sorted(lines_dict.keys())
            
            name_words = []
            room = "N/A"
            instructor = "N/A"
            activity = "نظري"
            section = ""
            
            for ly in sorted_lines_y:
                line_ws = lines_dict[ly]
                line_ws.sort(key=lambda w: w[0], reverse=True) # RTL
                line_text = " ".join([w[4] for w in line_ws]).strip()
                
                # Check fields using standalone word check
                if is_standalone_word("الرقم", line_text):
                    continue
                elif is_standalone_word("النشاط", line_text):
                    parts = line_text.split(":")
                    if len(parts) > 1:
                        val = parts[1].strip() or parts[0].strip()
                        activity = val.replace("النشاط", "").replace(":", "").strip()
                    continue
                elif is_standalone_word("الشعبة", line_text):
                    parts = line_text.split(":")
                    if len(parts) > 1:
                        val = parts[1].strip() or parts[0].strip()
                        section = val.replace("الشعبة", "").replace(":", "").strip()
                    continue
                elif is_standalone_word("المقر", line_text):
                    continue
                elif is_standalone_word("القاعة", line_text):
                    parts = line_text.split(":")
                    if len(parts) > 1:
                        val = parts[1].strip() or parts[0].strip()
                        room = val.replace("القاعة", "").replace(":", "").strip()
                    continue
                elif is_standalone_word("المحاضر", line_text):
                    parts = line_text.split(":")
                    if len(parts) > 1:
                        val = parts[1].strip() or parts[0].strip()
                        instructor = val.replace("المحاضر", "").replace(":", "").strip()
                    continue
                
                # Lines physically above the course code contain the name
                if ly < y_code - 2:
                    name_words.extend([w[4] for w in line_ws])
                    
            if not name_words:
                fallback_ws = lines_dict[sorted_lines_y[0]]
                fallback_ws.sort(key=lambda w: w[0], reverse=True)
                name_words = [w[4] for w in fallback_ws]
                
            course_name = clean_arabic_text(" ".join(name_words))
            course_name = course_name.replace("اإلنجلزيية", "الإنجليزية")
            course_name = course_name.replace("الربمجة", "البرمجة")
            course_name = course_name.replace("المتغريات", "المتغيرات")
            
            # Remove any trailing leaked keywords using standalone check
            for marker in ["الرقم", "النشاط", "الشعبة", "المقر", "القاعة", "المحاضر"]:
                pattern = r'(?<![\u0600-\u06FF])' + re.escape(marker) + r'(?![\u0600-\u06FF])'
                match = re.search(pattern, course_name)
                if match:
                    course_name = course_name[:match.start()].strip()
            
            course_entry = {
                "name": course_name,
                "code": code_text,
                "time": closest_slot["time"],
                "day": arabic_days[matched_day],
                "room": room,
                "instructor": instructor,
                "type": activity,
                "section": section
            }
            parsed_courses.append(course_entry)
            
    # Deduplicate courses
    unique_courses = []
    seen = set()
    for c in parsed_courses:
        key = (c["code"], c["day"], c["time"])
        if key not in seen:
            seen.add(key)
            unique_courses.append(c)
            
    return unique_courses

@router.post("/upload")
async def upload_schedule_file(file: UploadFile = File(...)):
    """
    Uploads a PDF or Image and extracts schedule data.
    Uses coordinate-based UQU layout parsing first for PDFs, falling back to regex.
    """
    logger.info(f"Received file upload: {file.filename}")
    if not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="يرجى رفع ملف PDF أو صورة فقط")
    
    try:
        content = await file.read()
        logger.info(f"File size: {len(content)} bytes")
        
        courses_data = []
        is_pdf = file.filename.lower().endswith('.pdf')
        
        # ─── Strategy 1: Coordinate-based parsing (PDF only) ───
        if is_pdf:
            try:
                doc = fitz.open(stream=content, filetype="pdf")
                courses_data = parse_uqu_pdf_stream(doc)
                doc.close()
                if courses_data:
                    logger.info(f"Successfully parsed {len(courses_data)} courses using coordinate method")
                    return {"courses": courses_data}
            except Exception as e:
                logger.error(f"Coordinate parsing error: {e}", exc_info=True)
                # Fall through to general text extraction
        
        # ─── Strategy 2: Text-based regex parsing (Fallback or Image) ───
        text = ""
        try:
            doc = fitz.open(stream=content, filetype="pdf" if is_pdf else file.filename.split('.')[-1])
            for page in doc:
                text += page.get_text()
            doc.close()
        except Exception as e:
            logger.error(f"Text extraction error: {e}")
            raise HTTPException(status_code=400, detail="فشل قراءة ملف الجدول")

        if not text.strip():
            raise HTTPException(status_code=400, detail="الملف لا يحتوي على نص قابل للقراءة")

        lines = [l.strip() for l in text.splitlines() if l.strip()]
        i = 0
        while i < len(lines):
            line = lines[i]
            time_match = re.match(r'(\d{1,2}:\d{2})\s*-?\s*(\d{1,2}:\d{2})', line)
            if time_match:
                time_val = f"{time_match.group(1)} - {time_match.group(2)}"
                i += 1
                name_parts = []
                code = ""
                room = ""
                instructor = ""
                
                while i < len(lines):
                    cl = lines[i]
                    if ":الرقم" in cl or "الرقم:" in cl:
                        code = cl.replace(":الرقم", "").replace("الرقم:", "").strip()
                        if not code and i + 1 < len(lines):
                            i += 1
                            code = lines[i].strip()
                        i += 1
                        break
                    if re.match(r'\d{1,2}:\d{2}\s*-?\s*\d{1,2}:\d{2}', cl):
                        break
                    name_parts.append(cl)
                    i += 1
                
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
                
                raw_name = " ".join(name_parts)
                clean_name = re.sub(r'\d{1,2}:\d{2}\s*-?\s*\d{1,2}:\d{2}', '', raw_name).strip()
                for noise in [":النشاط", "النشاط:", ":الشعبة", "الشعبة:", ":المقر", "المقر:", "نظري", "عملي"]:
                    clean_name = clean_name.replace(noise, "")
                clean_name = " ".join(clean_name.split())
                
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
        
        # Strategy 3: General code regex matcher
        if not courses_data:
            code_pattern = re.compile(r'[A-Z]{2,4}\d{3,4}')
            found_codes = code_pattern.findall(text)
            if found_codes:
                for code in set(found_codes):
                    idx = text.find(code)
                    context = text[max(0, idx-100):idx+100]
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
            seen = set()
            unique_courses = []
            for c in courses_data:
                key = f"{c['code']}_{c['time']}"
                if key not in seen:
                    seen.add(key)
                    unique_courses.append(c)
            logger.info(f"Successfully parsed {len(unique_courses)} courses from PDF using fallback")
            return {"courses": unique_courses}
        else:
            raise ValueError("لم يتم العثور على مواد في الملف. يرجى التأكد من أن الملف يحتوي على جدول دراسي واضح.")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File parse error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"فشل معالجة الملف: {str(e)}")
