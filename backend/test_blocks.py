import fitz
import json

doc = fitz.open('c:/Users/HP/Downloads/ai/جامعة أم القرى __ البوابة الإلكترونية للنظام الأكاديمي_ البوابة الاكاديمية.pdf')
out_blocks = []
for page_num, page in enumerate(doc):
    blocks = page.get_text("blocks")
    for b in blocks:
        out_blocks.append({
            "x0": b[0],
            "y0": b[1],
            "x1": b[2],
            "y1": b[3],
            "text": b[4],
            "block_no": b[5],
            "type": b[6]
        })

with open("blocks_output.json", "w", encoding="utf-8") as f:
    json.dump(out_blocks, f, ensure_ascii=False, indent=2)
print("Saved blocks to blocks_output.json")
