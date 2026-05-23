import json
import re

with open("words_coords.json", encoding="utf-8") as f:
    words = json.load(f)

def get_day_name(x_center):
    if x_center < 145:
        return "الخميس"
    elif 145 <= x_center < 225:
        return "الأربعاء"
    elif 225 <= x_center < 310:
        return "الثلاثاء"
    elif 310 <= x_center < 390:
        return "الاثنين"
    elif 390 <= x_center < 480:
        return "الأحد"
    else:
        return None

time_patterns = []
for w in words:
    text = w["text"]
    if re.match(r"\d{2}:\d{2}", text):
        time_patterns.append(w)

time_labels = []
for tp in time_patterns:
    if tp["x0"] > 480:
        time_labels.append(tp)

time_rows = []
for tl in sorted(time_labels, key=lambda x: x["y0"]):
    if not time_rows or abs(tl["y0"] - time_rows[-1]["y0"]) > 5:
        time_rows.append(tl)

sorted_time_rows = sorted(time_rows, key=lambda x: x["y0"])

def get_time_slot(y_center):
    best_time = None
    min_dist = 999999
    for tr in sorted_time_rows:
        dist = abs(y_center - tr["y0"])
        if dist < min_dist:
            min_dist = dist
            best_time = tr["text"]
    
    if min_dist < 40:
        return best_time
    return None

cells_data = {}
for w in words:
    text = w["text"]
    if any(day in text for day in ["الحد", "الث", "ني", "الثالثاء", "الربعاء", "الخميس", "الجدول", "تفاصيل", "الدرايس"]):
        continue
    if re.match(r"\d{2}:\d{2}", text) and w["x0"] > 480:
        continue
    
    x_center = (w["x0"] + w["x1"]) / 2
    y_center = (w["y0"] + w["y1"]) / 2
    
    day = get_day_name(x_center)
    time_val = get_time_slot(y_center)
    
    if day and time_val:
        key = (day, time_val)
        if key not in cells_data:
            cells_data[key] = []
        cells_data[key].append(w)

courses = []
for (day, time_val), cell_words in cells_data.items():
    cell_words.sort(key=lambda x: x["y0"])
    lines = []
    curr_line = []
    for cw in cell_words:
        if not curr_line or abs(cw["y0"] - curr_line[-1]["y0"]) < 5:
            curr_line.append(cw)
        else:
            lines.append(curr_line)
            curr_line = [cw]
    if curr_line:
        lines.append(curr_line)
        
    text_lines = []
    for line in lines:
        line.sort(key=lambda x: x["x0"], reverse=True)
        text_lines.append(" ".join([w["text"] for w in line]))
        
    name_parts = []
    code = ""
    room = ""
    instructor = ""
    activity = ""
    section = ""
    
    for tl in text_lines:
        if ":الرقم" in tl or "الرقم:" in tl:
            code = tl.replace(":الرقم", "").replace("الرقم:", "").strip()
        elif ":النشاط" in tl or "النشاط:" in tl:
            activity = tl.replace(":النشاط", "").replace("النشاط:", "").strip()
        elif ":الشعبة" in tl or "الشعبة:" in tl:
            section = tl.replace(":الشعبة", "").replace("الشعبة:", "").strip()
        elif ":المقر" in tl or "المقر:" in tl:
            pass
        elif ":القاعة" in tl or "القاعة:" in tl:
            room = tl.replace(":القاعة", "").replace("القاعة:", "").strip()
        elif ":المحاضر" in tl or "المحاضر:" in tl:
            instructor = tl.replace(":المحاضر", "").replace("المحاضر:", "").strip()
        else:
            if not tl.startswith(":") and len(tl) > 1:
                name_parts.append(tl)
                
    name = " ".join(name_parts)
    name = re.sub(r'\s+', ' ', name).strip()
    
    # We also want to map the time range correctly.
    # In UQU schedules, time slots are usually 50 minutes long.
    # Let's map start-end time.
    # e.g., if time_val is "08:00", range is "08:00 - 08:50"
    # Let's parse time_val to create a clean start and end time.
    start_time = time_val
    end_time = ""
    try:
        parts = start_time.split(":")
        h = int(parts[0])
        m = int(parts[1])
        # Add 50 minutes
        m_end = m + 50
        h_end = h
        if m_end >= 60:
            m_end -= 60
            h_end += 1
        end_time = f"{h_end:02d}:{m_end:02d}"
    except:
        end_time = ""
        
    time_range = f"{start_time} - {end_time}" if end_time else start_time
    
    courses.append({
        "name": name,
        "code": code,
        "day": day,
        "time": time_range,
        "room": room or "N/A",
        "instructor": instructor or "N/A",
        "activity": activity,
        "section": section
    })

with open("grid_parsed.json", "w", encoding="utf-8") as f:
    json.dump(courses, f, ensure_ascii=False, indent=2)
print("Saved grid_parsed.json successfully!")
