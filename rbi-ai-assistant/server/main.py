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

print("🚀 Starting RBI AI Backend...")
app = FastAPI()
print("✅ FastAPI Instance Created")

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
        response = supabase.table("documents").select("*").execute()
        docs = response.data or []
        
        # Calculate Category Stats
        category_counts = {}
        total_pages = 0
        for doc in docs:
            cat = doc.get("category", "General")
            category_counts[cat] = category_counts.get(cat, 0) + 1
            total_pages += doc.get("total_pages", 0) or 0

        # Format for frontend
        categories = []
        colors = ["#00FF88", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]
        for i, (name, count) in enumerate(category_counts.items()):
            categories.append({
                "name": name,
                "count": count,
                "color": colors[i % len(colors)]
            })

        return {
            "total_documents": len(docs),
            "total_pages": total_pages,
            "categories": categories
        }
    except Exception as e:
        print(f"Analytics Error: {e}")
        return {
            "total_documents": 0,
            "total_pages": 0,
            "categories": []
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
