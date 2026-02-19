from fastapi import APIRouter, HTTPException
from services.supabase_client import get_supabase
from services.scraper_service import RBIScraperService

router = APIRouter()

@router.get("/")
async def get_latest_rbi_updates():
    """Returns latest updates from the rbi_updates table."""
    try:
        supabase = get_supabase()
        res = supabase.table("rbi_updates").select("*").order("inserted_at", desc=True).limit(10).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
async def trigger_sync():
    """Manual trigger for RBI website synchronization."""
    scraper = RBIScraperService()
    count = await scraper.sync_updates()
    return {"message": "Sync complete", "processed_count": count}
