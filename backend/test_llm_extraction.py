import asyncio
import sys
import os

# Ensure backend directory is in path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.services.agents.llm_factory import create_chat_llm
from langchain_core.messages import HumanMessage
import fitz
import json
import re

async def main():
    file_path = "c:/Users/HP/Downloads/ai/جامعة أم القرى __ البوابة الإلكترونية للنظام الأكاديمي_ البوابة الاكاديمية.pdf"
    
    print("Reading PDF...")
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    
    print("Length of text:", len(text))
    
    llm = create_chat_llm(streaming=False)
    
    prompt = f"""
    Extract the academic schedule from the following text/content.
    Return ONLY a JSON array of courses.
    Each course MUST have these fields: 'name', 'code', 'time', 'day', 'room', 'instructor'.
    The 'day' field should be one of: 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'.
    The 'time' field should be in 24h format (e.g. 08:00) or a range (e.g. 08:00-10:00).
    Ensure the output is valid JSON and nothing else. NO MARKDOWN, NO EXPLANATION. JUST THE RAW JSON ARRAY.
    If you see a table, extract all its rows as courses.
    
    Content:
    {text}
    """
    
    print("Calling LLM...")
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    raw_content = str(response.content)
    
    print("Raw LLM Response:")
    print("---------------------------------")
    print(raw_content)
    print("---------------------------------")
    
    try:
        json_match = re.search(r'\[\s*\{.*?\}\s*\]', raw_content, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            courses_data = json.loads(json_str)
        else:
            clean_content = raw_content.replace('```json', '').replace('```', '').strip()
            courses_data = json.loads(clean_content)
        
        print(f"SUCCESS: Parsed {len(courses_data)} courses.")
        for c in courses_data:
            print(c)
    except Exception as e:
        print("ERROR parsing JSON:", e)

if __name__ == "__main__":
    asyncio.run(main())
