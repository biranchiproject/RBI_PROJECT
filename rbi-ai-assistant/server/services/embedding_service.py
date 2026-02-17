from sentence_transformers import SentenceTransformer
import asyncio
from typing import Optional

# Global model instance
_model: Optional[SentenceTransformer] = None

def get_model():
    """
    Lazy loads the SentenceTransformer model to ensure fast server startup.
    """
    global _model
    if _model is None:
        print("🧠 Loading SentenceTransformer model...")
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        print("✅ Model loaded successfully.")
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
