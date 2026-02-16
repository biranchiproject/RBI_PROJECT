from sentence_transformers import SentenceTransformer
import asyncio

# Initialize the model once and reuse it
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def generate_embedding(text: str):
    """
    Generates embedding for the given text using the global SentenceTransformer model.
    Returns a list of floats.
    """
    if not text:
        return []
    embedding = model.encode(text)
    return embedding.tolist()
