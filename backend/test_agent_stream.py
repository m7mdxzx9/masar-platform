import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.agents.agent_service import agent_chat_stream

async def main():
    print("Testing agent_chat_stream...")
    try:
        async for token in agent_chat_stream("مرحبا، أنا طالب في هندسة الحاسب", "math_tutor"):
            sys.stdout.write(token)
            sys.stdout.flush()
        print("\nSuccess!")
    except Exception as e:
        print("\nException encountered:", e)

if __name__ == "__main__":
    # Ensure stdout handles UTF-8 for Arabic characters
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    asyncio.run(main())
