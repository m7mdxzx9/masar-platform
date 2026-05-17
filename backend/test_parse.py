import re, json

with open("pdf_output.txt", encoding="utf-8") as f:
    lines = f.read().splitlines()

courses = []
i = 0
while i < len(lines):
    line = lines[i].strip()
    # Matches times like "08:50- 08:00" or "09:50- 09:00"
    if re.match(r"\d{2}:\d{2}\s*-\s*\d{2}:\d{2}", line):
        time = line
        name_parts = []
        i += 1
        # Collect name until we hit the code
        while i < len(lines) and not lines[i].startswith(":الرقم"):
            name_parts.append(lines[i].strip())
            i += 1
        
        if i >= len(lines): break
        code = lines[i].replace(":الرقم", "").strip()
        i += 1
        
        activity = ""
        if lines[i].startswith(":النشاط"):
            activity = lines[i].replace(":النشاط", "").strip()
            if not activity:
                i += 1
                activity = lines[i].strip()
        
        # Scan ahead for Room
        room = ""
        while i < len(lines) and not lines[i].startswith(":القاعة") and not re.match(r"\d{2}:\d{2}\s*-\s*\d{2}:\d{2}", lines[i]):
            i += 1
            
        if i < len(lines) and lines[i].startswith(":القاعة"):
            room = lines[i].replace(":القاعة", "").strip()
            
        courses.append({
            "name": " ".join(name_parts),
            "code": code,
            "time": time,
            "room": room,
            "instructor": "N/A",
            "day": "Unknown"
        })
    else:
        i += 1

with open("out.json", "w", encoding="utf-8") as out:
    out.write(json.dumps(courses, ensure_ascii=False, indent=2))
