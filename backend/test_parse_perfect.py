import json
import re

with open("blocks_output.json", encoding="utf-8") as f:
    blocks = json.load(f)

# Sort blocks by page and then by y0
# We only have 1 page in this PDF, but let's be safe
blocks.sort(key=lambda b: b["y0"])

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

# Time slots from the right column
time_labels = []
for b in blocks:
    text = b["text"].strip()
    # Find patterns like "08:50- 08:00" or similar
    if re.match(r"\d{2}:\d{2}\s*-\s*\d{2}:\d{2}", text) and b["x0"] > 470:
        time_labels.append({
            "text": text,
            "y0": b["y0"],
            "y1": b["y1"]
        })
    elif re.match(r"\d{2}:\d{2}", text) and b["x0"] > 470:
        time_labels.append({
            "text": text,
            "y0": b["y0"],
            "y1": b["y1"]
        })

print("Time labels detected:")
for tl in sorted(time_labels, key=lambda x: x["y0"]):
    print(f"Time: {tl['text']} at Y={tl['y0']:.1f}")

# Group blocks by day
day_blocks = {
    "الأحد": [],
    "الاثنين": [],
    "الثلاثاء": [],
    "الأربعاء": [],
    "الخميس": []
}

for b in blocks:
    text = b["text"].strip()
    if not text:
        continue
    # Skip headers/footers
    if b["y0"] < 100 and "الجدول" in text:
        continue
    if "تفاصيل" in text or "الدرايس" in text or "الثاين" in text:
        continue
    if any(day in text for day in ["الحد", "الخميس", "الربعاء", "الثالثاء"]) and b["y0"] < 130:
        continue
        
    x_center = (b["x0"] + b["x1"]) / 2
    day = get_day_name(x_center)
    if day:
        day_blocks[day].append(b)

courses = []

# For each day, group contiguous blocks into courses
for day, dblocks in day_blocks.items():
    # Sort blocks by Y coordinate
    dblocks.sort(key=lambda b: b["y0"])
    
    current_course = None
    
    for b in dblocks:
        text = b["text"].strip()
        # Check if this block starts a new course
        # A new course block typically contains text that doesn't start with a colon
        is_prop = any(text.startswith(prefix) for prefix in [":الرقم", ":النشاط", ":الشعبة", ":المقر", ":القاعة", ":المحاضر", "الرقم:", "النشاط:", "الشعبة:", "المقر:", "القاعة:", "المحاضر:"])
        
        # If it's not a property block, it's either the subject name or a continuation of name
        if not is_prop:
            # If current_course is active, decide if we should start a new course or append to name
            # A new course starts if the Y distance is larger than, say, 25 points,
            # or if the current course already has some properties filled (like code or section).
            if current_course and (b["y0"] - current_course["last_y"] > 25 or current_course["code"] or current_course["room"]):
                courses.append(current_course)
                current_course = None
                
            if current_course is None:
                current_course = {
                    "name": text.replace("\n", " "),
                    "code": "",
                    "activity": "",
                    "section": "",
                    "room": "",
                    "instructor": "",
                    "day": day,
                    "y0": b["y0"],
                    "y1": b["y1"],
                    "last_y": b["y1"]
                }
            else:
                # Continuation of name
                current_course["name"] += " " + text.replace("\n", " ")
                current_course["last_y"] = b["y1"]
                current_course["y1"] = b["y1"]
        else:
            # It's a property block
            if current_course is None:
                # Orphan property block, ignore or initialize
                continue
                
            # Update last_y
            current_course["last_y"] = b["y1"]
            current_course["y1"] = b["y1"]
            
            # Parse lines of the property block
            lines = text.split("\n")
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                if ":الرقم" in line or "الرقم:" in line:
                    current_course["code"] = line.replace(":الرقم", "").replace("الرقم:", "").strip()
                elif ":النشاط" in line or "النشاط:" in line:
                    current_course["activity"] = line.replace(":النشاط", "").replace("النشاط:", "").strip()
                elif ":الشعبة" in line or "الشعبة:" in line:
                    current_course["section"] = line.replace(":الشعبة", "").replace("الشعبة:", "").strip()
                elif ":القاعة" in line or "القاعة:" in line:
                    current_course["room"] = line.replace(":القاعة", "").replace("القاعة:", "").strip()
                elif ":المحاضر" in line or "المحاضر:" in line:
                    current_course["instructor"] = line.replace(":المحاضر", "").replace("المحاضر:", "").strip()
                    
    if current_course:
        courses.append(current_course)

# Map courses to time slots based on their Y coordinates
# UQU schedules have time slots with y coordinates
# Let's find the closest time label for each course
for c in courses:
    y_center = (c["y0"] + c["y1"]) / 2
    
    # Let's find the time label whose Y center is closest to y_center
    best_time = "غير محدد"
    min_dist = 999999
    for tl in time_labels:
        tl_center = (tl["y0"] + tl["y1"]) / 2
        dist = abs(y_center - tl_center)
        if dist < min_dist:
            min_dist = dist
            best_time = tl["text"]
            
    c["time"] = best_time

# Clean up names
for c in courses:
    c["name"] = re.sub(r'\s+', ' ', c["name"]).strip()
    # Normalize spelling mistakes from PDF text flow (e.g. "اإلنجلزيية" -> "الإنجليزية")
    replacements = {
        "اإلنجلزيية": "الإنجليزية",
        "الربمجة": "البرمجة",
        "الدرايس": "الدراسي",
        "الثاين": "الثاني",
        "الشيئية": "الشيئية",
        "المنطقي": "المنطقي",
        "المتغريات": "المتغيرات",
        "عديد": "عديد",
        "تفاضل": "تفاضل",
        "وتكامل": "وتكامل"
    }
    for old, new in replacements.items():
        c["name"] = c["name"].replace(old, new)

# Write to file
output_courses = []
for c in courses:
    output_courses.append({
        "name": c["name"],
        "code": c["code"],
        "day": c["day"],
        "time": c["time"],
        "room": c["room"] or "N/A",
        "instructor": c["instructor"] or "N/A",
        "section": c["section"],
        "activity": c["activity"]
    })

with open("grid_parsed_perfect.json", "w", encoding="utf-8") as f:
    json.dump(output_courses, f, ensure_ascii=False, indent=2)

print(f"Saved {len(output_courses)} courses to grid_parsed_perfect.json")
