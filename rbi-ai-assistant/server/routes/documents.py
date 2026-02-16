from fastapi import APIRouter, HTTPException, Body
from services.supabase_client import get_supabase
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class DeleteDocumentsRequest(BaseModel):
    ids: List[int]

BUCKET_NAME = "rbi-documents"

@router.get("/circulars")
def get_circulars():
    try:
        supabase = get_supabase()
        response = supabase.table("documents").select("*").execute()
        return response.data
    except Exception as e:
        print(f"Error fetching circulars: {e}")
        return []

@router.delete("/documents")
def delete_documents(request: DeleteDocumentsRequest):
    """
    Delete documents by IDs.
    1. Fetch file paths (or URLs) to determine storage paths.
    2. Delete from Storage.
    3. Delete from Database.
    """
    ids = request.ids
    if not ids:
        return {"message": "No IDs provided"}

    try:
        supabase = get_supabase()
        
        # 1. Fetch paths to delete from storage
        # We need the 'file_path' column which contains the public URL. 
        # We assume the storage path is the last part of the URL.
        response = supabase.table("documents").select("file_path").in_("id", ids).execute()
        files = response.data
        
        storage_paths = []
        for file in files:
            url = file.get("file_path", "")
            if url:
                # Extract filename from URL (e.g. .../rbi-documents/uuid.pdf -> uuid.pdf)
                # It usually comes after the bucket name or at the end
                path = url.split(f"/{BUCKET_NAME}/")[-1]
                if path:
                    storage_paths.append(path)
        
        # 2. Delete from Storage
        if storage_paths:
             supabase.storage.from_(BUCKET_NAME).remove(storage_paths)

        # 3. Delete from Database
        supabase.table("documents").delete().in_("id", ids).execute()

        return {"message": "Documents deleted successfully"}

    except Exception as e:
        print(f"Delete Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
