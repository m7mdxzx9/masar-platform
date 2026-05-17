import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            print("Trying uqu.edu.sa")
            await page.goto('https://uqu.edu.sa/', wait_until='networkidle')
            print("Title:", await page.title())
            
            print("Trying eservices.uqu.edu.sa")
            await page.goto('https://eservices.uqu.edu.sa/', wait_until='networkidle')
            print("Title:", await page.title())
        except Exception as e:
            print("Error:", e)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
