import fitz

def extract_table_text(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        blocks = page.get_text("dict")["blocks"]
        
        # Flatten all spans into a list of words with their bounding boxes
        words = []
        for b in blocks:
            if b["type"] == 0:  # text block
                for l in b["lines"]:
                    for s in l["spans"]:
                        text = s["text"].strip()
                        if text:
                            # Use center of bounding box for sorting
                            bbox = s["bbox"]
                            x_center = (bbox[0] + bbox[2]) / 2
                            y_center = (bbox[1] + bbox[3]) / 2
                            words.append({"text": text, "x": x_center, "y": y_center, "bbox": bbox})
        
        if not words:
            continue
            
        # Group words into rows based on y-coordinate (with a tolerance)
        words.sort(key=lambda w: w["y"])
        
        rows = []
        current_row = [words[0]]
        for w in words[1:]:
            # If the y-difference is less than, say, 5 points, they are on the same line
            if abs(w["y"] - current_row[-1]["y"]) < 5:
                current_row.append(w)
            else:
                rows.append(current_row)
                current_row = [w]
        rows.append(current_row)
        
        # Sort each row by x-coordinate (right-to-left for Arabic)
        for row in rows:
            row.sort(key=lambda w: w["x"], reverse=True)
            row_text = " | ".join([w["text"] for w in row])
            full_text += row_text + "\n"
            
    doc.close()
    return full_text

if __name__ == "__main__":
    file_path = 'c:/Users/HP/Downloads/ai/جامعة أم القرى __ البوابة الإلكترونية للنظام الأكاديمي_ البوابة الاكاديمية.pdf'
    with open("output_table.txt", "w", encoding="utf-8") as f:
        f.write(extract_table_text(file_path))
