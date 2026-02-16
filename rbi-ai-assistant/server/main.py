from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import upload, notifications, documents, ask
from dotenv import load_dotenv
import os
from services.supabase_client import get_supabase
from pydantic import BaseModel
from typing import List, Optional

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    file_id: Optional[str] = None

@app.get("/")
def read_root():
    return {"status": "Server Running"}

# get_circulars moved to routes/documents.py

@app.get("/api/analytics")
def get_analytics():
    try:
        supabase = get_supabase()
        # count='exact' allows getting the count without data if head=True, but here we want data too?
        # Actually the simplified logic previously used:
        response = supabase.table("documents").select("*", count="exact").execute()
        count = response.count if response.count is not None else len(response.data)
    except:
        count = 0
        
    return {
        "total_documents": count,
        "categories": [
            {"name": "Notifications", "count": 12, "color": "#10B981"},
            {"name": "Master Directions", "count": 8, "color": "#3B82F6"},
            {"name": "Circulars", "count": 24, "color": "#F59E0B"},
            {"name": "Guidelines", "count": 5, "color": "#EF4444"}
        ]
    }

@app.get("/api/queries")
def get_queries():
    return []

@app.post("/api/chat")
def chat(request: ChatRequest):
    return {"reply": "AI response coming soon (Mock)."}

# Include Routers
app.include_router(upload.router, prefix="/api")
app.include_router(notifications.router, prefix="/api/notifications")
app.include_router(documents.router, prefix="/api")
app.include_router(ask.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
