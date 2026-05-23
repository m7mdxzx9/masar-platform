import fitz
import json

doc = fitz.open('c:/Users/HP/Downloads/ai/جامعة أم القرى __ البوابة الإلكترونية للنظام الأكاديمي_ البوابة الاكاديمية.pdf')
out_words = []
for page_num, page in enumerate(doc):
    for w in page.get_text("words"):
        out_words.append({
            "text": w[4],
            "x0": w[0],
            "y0": w[1],
            "x1": w[2],
            "y1": w[3]
        })
with open("words_coords.json", "w", encoding="utf-8") as f:
    json.dump(out_words, f, ensure_ascii=False, indent=2)
print("Saved coordinates to words_coords.json")
