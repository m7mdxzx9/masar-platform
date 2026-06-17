import re

files_to_fix = [
    r"c:\Users\HP\Downloads\ai\frontend\src\data\lessonsData.ts",
    r"c:\Users\HP\Downloads\ai\mobile\src\data\lessonsData.ts"
]

for file_path in files_to_fix:
    print(f"Processing: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace \\` with \`
        fixed_content = content.replace(r'\\`', r'\`')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        print("Success!")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
