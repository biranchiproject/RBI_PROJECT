import asyncio
import os
from services.scraper_service import RBIScraperService
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env"))

async def manual_sync():
    scraper = RBIScraperService()
    print("Starting manual sync...")
    count = await scraper.sync_updates()
    print(f"Manual sync finished. Processed {count} updates.")

if __name__ == "__main__":
    asyncio.run(manual_sync())
