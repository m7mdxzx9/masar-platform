import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        try:
            print("Navigating to sso.uqu.edu.sa...")
            await page.goto('https://sso.uqu.edu.sa/', wait_until='networkidle')
            print("Title:", await page.title())
        except Exception as e:
            print("Error:", e)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
