from fastapi import APIRouter, HTTPException
from services.supabase_client import get_supabase
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class Notification(BaseModel):
    id: int
    message: str
    type: str
    is_read: bool
    created_at: str

@router.get("/")
def get_notifications():
    """Fetch latest notifications ordered by created_at desc"""
    try:
        supabase = get_supabase()
        response = supabase.table("notifications")\
            .select("*")\
            .order("created_at", desc=True)\
            .limit(50)\
            .execute()
        return response.data
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return []

@router.get("/unread-count")
def get_unread_count():
    """Return count where is_read = false"""
    try:
        supabase = get_supabase()
        # count='exact' allows getting the count without data if head=True, 
        # but supabase-py select(count='exact') returns count property
        response = supabase.table("notifications")\
            .select("*", count="exact")\
            .eq("is_read", False)\
            .execute()
        
        return {"count": response.count}
    except Exception as e:
        print(f"Error counting unread notifications: {e}")
        return {"count": 0}

@router.post("/{id}/mark-read")
def mark_read(id: int):
    """Update is_read = true for specific ID"""
    try:
        supabase = get_supabase()
        supabase.table("notifications")\
            .update({"is_read": True})\
            .eq("id", id)\
            .execute()
        return {"message": "Marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mark-all-read")
def mark_all_read():
    """Set all is_read = true"""
    try:
        supabase = get_supabase()
        # Update all records where is_read is false
        supabase.table("notifications")\
            .update({"is_read": True})\
            .eq("is_read", False)\
            .execute()
        return {"message": "All marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
