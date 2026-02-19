import asyncio
import threading
import time
from services.scraper_service import RBIScraperService

def run_scraper_loop():
    """Loops every 24 hours to scrape RBI updates."""
    scraper = RBIScraperService()
    while True:
        try:
            print("INFO: Background Scraper started...")
            asyncio.run(scraper.sync_updates())
            print("SUCCESS: Background Scraper cycle complete.")
        except Exception as e:
            print(f"ERROR: Background Scraper failed: {e}")
        
        # Sleep for 24 hours
        time.sleep(24 * 60 * 60)

def start_background_tasks():
    """Starts background threads for daily tasks."""
    thread = threading.Thread(target=run_scraper_loop, daemon=True)
    thread.start()
    print("INFO: Background tasks (RBI Scraper) started.")
