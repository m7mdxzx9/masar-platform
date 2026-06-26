import fitz
import re
import json

def is_standalone_word(word: str, text: str) -> bool:
    pattern = r'(?<![\u0600-\u06FF])' + re.escape(word) + r'(?![\u0600-\u06FF])'
    return bool(re.search(pattern, text))

def clean_arabic_text(text: str) -> str:
    # UQU schedules can have reversed Arabic strings because of RTL issues.
    # For example, "وتكامل تفاضل" should be "تفاضل وتكامل".
    # Let's fix common ones if we see them, or write a general reverser for words.
    words = text.strip().split()
    # If the text has Arabic words, let's check if they need reversal.
    # In some PDFs, the word sequence is reversed. For example: "وتكامل تفاضل" -> "تفاضل وتكامل"
    # "اللغة اإلنجلزيية (2)" -> "اللغة الإنجليزية (2)"
    # Let's check for specific known UQU course names and correct them:
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
        
    # Also fix spelling/typos
    full_str = full_str.replace("اإلنجلزيية", "الإنجليزية")
    full_str = full_str.replace("الربمجة", "البرمجة")
    full_str = full_str.replace("التفاصيل", "")
    return full_str.strip()

def parse_uqu_pdf(pdf_path: str):
    doc = fitz.open(pdf_path)
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

if __name__ == "__main__":
    courses = parse_uqu_pdf("جامعة أم القرى __ البوابة الإلكترونية للنظام الأكاديمي_ البوابة الاكاديمية.pdf")
    print(json.dumps(courses, ensure_ascii=False, indent=2))
