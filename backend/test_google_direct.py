import asyncio
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
print("Using Google API Key:", api_key)

async def test_model(model_name):
    print(f"Testing model {model_name}...")
    try:
        client = genai.Client(api_key=api_key)
        config = types.GenerateContentConfig(
            system_instruction="Explain shortly",
            temperature=0.4,
            max_output_tokens=2048,
        )
        response = await client.aio.models.generate_content(
            model=model_name,
            contents="Hi, write a one-word answer.",
            config=config,
        )
        print(f"Success for {model_name}: {response.text}")
    except Exception as e:
        print(f"Failed for {model_name}: {e}")

async def main():
    await test_model("gemini-2.0-flash")
    await test_model("gemini-2.5-flash")

if __name__ == "__main__":
    asyncio.run(main())
