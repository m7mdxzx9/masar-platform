import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from app.services.agents.agent_service import agent_chat_stream

async def main():
    print("Testing agent_chat_stream...")
    try:
        async for token in agent_chat_stream("Explain the difference between a list and a tuple in Python in 10 words.", "general"):
            sys.stdout.write(token)
            sys.stdout.flush()
        print("\nSuccess!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("\nException encountered:", e)

if __name__ == "__main__":
    # Ensure stdout handles UTF-8 for Arabic characters
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    asyncio.run(main())
