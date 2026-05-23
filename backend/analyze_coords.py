import json

with open("words_coords.json", encoding="utf-8") as f:
    words = json.load(f)

# Find days
days = ["الحد", "الث", "ني", "الثالثاء", "الربعاء", "الخميس"]
found_days = []
for w in words:
    for d in days:
        if d in w["text"]:
            found_days.append(w)

with open("analysis_output.txt", "w", encoding="utf-8") as out:
    out.write("--- Day coordinates ---\n")
    for fd in sorted(found_days, key=lambda x: x["x0"]):
        out.write(f"{fd['text']}: x0={fd['x0']:.1f}, x1={fd['x1']:.1f}, y0={fd['y0']:.1f}\n")

    # Find times
    times = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]
    found_times = []
    for w in words:
        for t in times:
            if t in w["text"]:
                found_times.append(w)

    out.write("\n--- Time coordinates ---\n")
    for ft in sorted(found_times, key=lambda x: x["y0"]):
        out.write(f"{ft['text']}: x0={ft['x0']:.1f}, x1={ft['x1']:.1f}, y0={ft['y0']:.1f}\n")

print("Wrote analysis to analysis_output.txt")
