from sentence_transformers import SentenceTransformer
import os

model_name = "sentence-transformers/all-MiniLM-L6-v2"
print(f"🚀 Pre-downloading model: {model_name}...")

try:
    # This will download the model to the default cache directory
    model = SentenceTransformer(model_name)
    print("✅ Model downloaded and cached successfully!")
except Exception as e:
    print(f"❌ Error downloading model: {e}")
    exit(1)
