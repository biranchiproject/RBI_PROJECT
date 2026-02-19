import asyncio
from typing import Optional

# Global model instance
_model: Optional[object] = None # Using object to avoid eager import type check

def get_model():
    """
    Lazy loads the SentenceTransformer model to ensure fast server startup.
    This prevents Render health check timeouts by moving the
    heavy import and model loading into the first request.
    """
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        print("INFO: Loading SentenceTransformer model...")
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        print("SUCCESS: Model loaded successfully.")
    return _model

def generate_embedding(text: str):
    """
    Generates embedding for the given text using a lazy-loaded model.
    Returns a list of floats.
    """
    if not text:
        return []
    
    model = get_model()
    embedding = model.encode(text)
    return embedding.tolist()
