import urllib.request
import sqlite3
import json
import os

def parse_sql_line(line):
    line = line.strip()
    if not line.startswith('('):
        return None
    
    # We want to parse the tuple.
    # The tuple is of form (id, 'eng', 'ara')
    # Find the first comma separating the ID
    comma_idx = line.find(',')
    if comma_idx == -1:
        return None
    
    rest = line[comma_idx+1:].strip()
    
    # Helper to extract the next SQL single-quoted string
    def extract_string(s):
        if not s.startswith("'"):
            return None, s
        chars = []
        i = 1
        while i < len(s):
            if s[i] == "'":
                if i + 1 < len(s) and s[i+1] == "'":
                    # Escaped quote ''
                    chars.append("'")
                    i += 2
                    continue
                else:
                    # End of string
                    return "".join(chars), s[i+1:].strip()
            elif s[i] == "\\":
                if i + 1 < len(s):
                    # Backslash escaping
                    if s[i+1] == "'":
                        chars.append("'")
                    elif s[i+1] == "\\":
                        chars.append("\\")
                    else:
                        chars.append(s[i+1])
                    i += 2
                    continue
            chars.append(s[i])
            i += 1
        return "".join(chars), ""
    
    eng, rest = extract_string(rest)
    if eng is None:
        return None
    
    if rest.startswith(','):
        rest = rest[1:].strip()
        
    ara, rest = extract_string(rest)
    if ara is None:
        return None
        
    return eng, ara

def main():
    sql_path = "C:/Users/HP/.gemini/antigravity/brain/655f2dbb-f2b8-4f4a-ac2f-4baab7cdd533/scratch/engAraDictionary.sql"
    
    if not os.path.exists(sql_path):
        url = "https://raw.githubusercontent.com/usefksa/engAraDictionaryFrom_ArabEyes/master/engAraDictionary.sql"
        print("Downloading ArabEyes dictionary SQL dump...")
        urllib.request.urlretrieve(url, sql_path)
        print("Download completed.")
    
    words_dict = {}
    
    print("Parsing SQL inserts line-by-line...")
    count = 0
    with open(sql_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith('('):
                res = parse_sql_line(line)
                if res:
                    eng, ara = res
                    eng_clean = eng.strip().lower()
                    ara_clean = ara.strip()
                    if eng_clean and ara_clean:
                        # Split multiple meanings
                        meanings = [m.strip() for m in re_split(ara_clean) if m.strip()]
                        if meanings:
                            if eng_clean in words_dict:
                                words_dict[eng_clean] = list(dict.fromkeys(words_dict[eng_clean] + meanings))
                            else:
                                words_dict[eng_clean] = meanings
                            count += 1
                            
    print(f"Total entries parsed: {count}")
    print(f"Total unique words parsed: {len(words_dict)}")
    
    # Save as JSON
    json_path = "C:/Users/HP/.gemini/antigravity/brain/655f2dbb-f2b8-4f4a-ac2f-4baab7cdd533/scratch/dictionary.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(words_dict, f, ensure_ascii=False, indent=2)
    print(f"Saved JSON dictionary to {json_path}")
    
    # Save as SQLite
    sqlite_path = "C:/Users/HP/.gemini/antigravity/brain/655f2dbb-f2b8-4f4a-ac2f-4baab7cdd533/scratch/dictionary.db"
    if os.path.exists(sqlite_path):
        os.remove(sqlite_path)
        
    conn = sqlite3.connect(sqlite_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE dictionary (
            word TEXT PRIMARY KEY,
            meanings TEXT NOT NULL
        )
    """)
    
    # Batch insert
    insert_data = [(w, json.dumps(m, ensure_ascii=False)) for w, m in words_dict.items()]
    cursor.executemany("INSERT OR REPLACE INTO dictionary VALUES (?, ?)", insert_data)
    conn.commit()
    conn.close()
    print(f"Saved SQLite database to {sqlite_path}")

def re_split(text):
    # Simple split by :: or , or ، or ;
    parts = []
    current = []
    i = 0
    while i < len(text):
        if text[i:i+2] == "::":
            parts.append("".join(current).strip())
            current = []
            i += 2
        elif text[i] in (",", "،", ";"):
            parts.append("".join(current).strip())
            current = []
            i += 1
        else:
            current.append(text[i])
            i += 1
    if current:
        parts.append("".join(current).strip())
    return parts

if __name__ == "__main__":
    main()
