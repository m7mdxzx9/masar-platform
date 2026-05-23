import asyncio
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='backend/.env')

async def main():
    from langchain_openai import ChatOpenAI
    
    llm = ChatOpenAI(
        model=os.getenv("OPENROUTER_MODEL"),
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base=os.getenv("OPENROUTER_BASE_URL"),
        temperature=0.7,
        max_tokens=100
    )
    try:
        response = await llm.ainvoke([
            {"role": "user", "content": "مرحبا، هل تعمل بشكل صحيح؟ أجب بكلمة نعم فقط."}
        ])
        print("Response:", response.content)
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    asyncio.run(main())
