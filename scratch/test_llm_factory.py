import asyncio
import os
import sys
import logging

# Ensure backend directory is in path
sys.path.append(os.path.abspath('backend'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(dotenv_path='backend/.env')

# Setup basic logging
logging.basicConfig(level=logging.INFO)

# Import the actual factories and classes from the app
from app.services.agents.llm_factory import create_chat_llm
from langchain_core.messages import HumanMessage

async def test_app_gemini():
    print("Testing app GeminiDirectChat via create_chat_llm()...")
    try:
        llm = create_chat_llm(provider="google", temperature=0.7)
        response = await llm.ainvoke([
            HumanMessage(content="مرحبا، هل تعمل بشكل صحيح؟ أجب بكلمة نعم فقط.")
        ])
        safe_content = response.content.encode('ascii', 'backslashreplace').decode('ascii')
        print(f"  Gemini Success: {safe_content}")
        return True
    except Exception as e:
        print(f"  Gemini Failed: {e}")
        return False

async def test_app_openrouter():
    print("Testing app OpenRouter (ChatOpenAI) via create_chat_llm()...")
    try:
        llm = create_chat_llm(provider="openrouter", temperature=0.7)
        response = await llm.ainvoke([
            HumanMessage(content="مرحبا، هل تعمل بشكل صحيح؟ أجب بكلمة نعم فقط.")
        ])
        safe_content = response.content.encode('ascii', 'backslashreplace').decode('ascii')
        print(f"  OpenRouter Success: {safe_content}")
        return True
    except Exception as e:
        print(f"  OpenRouter Failed: {e}")
        return False

async def main():
    print("==================================================")
    print("STARTING APP-LEVEL LLM FACTORY INTEGRATION TESTS")
    print("==================================================")
    
    gemini_ok = await test_app_gemini()
    print("-" * 50)
    openrouter_ok = await test_app_openrouter()
    print("==================================================")
    if gemini_ok and openrouter_ok:
        print("RESULT: ALL INTEGRATION TESTS PASSED SUCCESSFULLY! [SUCCESS]")
    else:
        print("RESULT: INTEGRATION TESTS FAILED! [FAILED]")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
