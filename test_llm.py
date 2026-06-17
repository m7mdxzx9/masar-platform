import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv(dotenv_path='backend/.env')

async def test_openrouter():
    print("Testing OpenRouter via LangChain ChatOpenAI...")
    from langchain_openai import ChatOpenAI
    
    model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    
    print(f"  Model: {model}")
    print(f"  Base URL: {base_url}")
    
    llm = ChatOpenAI(
        model=model,
        openai_api_key=api_key,
        openai_api_base=base_url,
        temperature=0.7,
        max_tokens=100
    )
    try:
        response = await llm.ainvoke([
            {"role": "user", "content": "مرحبا، هل تعمل بشكل صحيح؟ أجب بكلمة نعم فقط."}
        ])
        safe_content = response.content.encode('ascii', 'backslashreplace').decode('ascii')
        print("  Response:", safe_content)
    except Exception as e:
        print("  Error:", str(e))

async def test_gemini():
    print("Testing Google Gemini...")
    google_api_key = os.getenv("GOOGLE_API_KEY")
    print(f"  API Key is set: {bool(google_api_key)}")
    
    # We can use the project's GeminiDirectChat or python client directly
    try:
        from google import genai
        client = genai.Client(api_key=google_api_key)
        # Using gemini-2.5-flash
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="مرحبا، هل تعمل بشكل صحيح؟ أجب بكلمة نعم فقط."
        )
        safe_content = response.text.encode('ascii', 'backslashreplace').decode('ascii')
        print("  Response:", safe_content)
    except Exception as e:
        print("  Error:", str(e))

async def main():
    await test_openrouter()
    print("-" * 40)
    await test_gemini()

if __name__ == "__main__":
    asyncio.run(main())
