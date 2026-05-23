import fitz

pdf_path = "جامعة أم القرى __ البوابة الإلكترونية للنظام الأكاديمي_ البوابة الاكاديمية.pdf"
doc = fitz.open(pdf_path)

with open("pdf_layout.txt", "w", encoding="utf-8") as out:
    out.write(f"Total Pages: {len(doc)}\n")
    for page_idx, page in enumerate(doc):
        out.write(f"\n--- Page {page_idx} ---\n")
        words = page.get_text("words")
        # Sort words by y0, then x0
        words.sort(key=lambda w: (w[1], w[0]))
        for w in words:
            # w is (x0, y0, x1, y1, 'text', block_no, line_no, word_no)
            out.write(f"({w[0]:.1f}, {w[1]:.1f}, {w[2]:.1f}, {w[3]:.1f}): {w[4]}\n")
