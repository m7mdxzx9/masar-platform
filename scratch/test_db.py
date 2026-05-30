import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend")

from app.core.database import engine

async def test():
    try:
        async with engine.connect() as conn:
            print("Connected to database successfully!")
    except Exception as e:
        print(f"Failed to connect to database: {e}")

if __name__ == "__main__":
    asyncio.run(test())
