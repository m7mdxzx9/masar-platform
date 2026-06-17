import os
import sys
from dotenv import load_dotenv

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, "backend"))

load_dotenv(dotenv_path='backend/.env')

from google import genai
from google.genai import types
from app.services.tools.agent_tools import ALL_TOOLS
from scratch.test_tool_conversion import langchain_tool_to_gemini_function

def main():
    api_key = os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key)
    
    gemini_tools = []
    for t in ALL_TOOLS:
        gemini_tools.append(langchain_tool_to_gemini_function(t))
    
    tool = types.Tool(function_declarations=gemini_tools)
    
    config = types.GenerateContentConfig(
        tools=[tool],
        temperature=0.0,
    )
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="ابحث في ملاحظات مادة الجبر الخطي",
            config=config,
        )
        print("Response text:", response.text)
        print("Response function_calls:", response.function_calls)
        if response.function_calls:
            for fc in response.function_calls:
                print("FC name:", fc.name)
                print("FC args:", fc.args)
    except Exception as e:
        print("Error during execution:", e)

if __name__ == "__main__":
    main()
