from fastapi import APIRouter, HTTPException, Body
from services.supabase_client import get_supabase
from pydantic import BaseModel
from services.embedding_service import generate_embedding
from groq import Groq
import os

from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# Clients
try:
    # Initialize Groq for LLaMA generation
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
except Exception as e:
    print(f"Client Init Error: {e}")
    groq_client = None

class AskRequest(BaseModel):
    question: str

@router.post("/ask")
async def ask_question(request: AskRequest):
    if not groq_client:
        raise HTTPException(status_code=503, detail="AI services not available. Check API keys.")

    question = request.question
    
    # 1. Embed Question
    try:
        # Run synchronous generate_embedding directly
        question_embedding = generate_embedding(question)
    except Exception as e:
        print(f"Embedding error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate embedding.")

    # 2. Similarity Search (RPC)
    supabase = get_supabase()
    chunks = []
    try:
        # Call the Supabase function 'match_documents'
        # Parameters: query_embedding, match_threshold, match_count
        params = {
            "query_embedding": question_embedding,
            "match_threshold": 0.3, # Similarity threshold
            "match_count": 10
        }
        response = supabase.rpc("match_documents", params).execute()
        
        # Check if response has data
        if hasattr(response, 'data') and response.data:
            chunks = response.data
            print(f"✅ Retrieved {len(chunks)} chunks from vector store.")
            
            # Log similarity scores
            for i, chunk in enumerate(chunks):
                sim = chunk.get('similarity', 0)
                fname = chunk.get('filename', 'Unknown')
                cid = chunk.get('id', 'Unknown')
                print(f"   - Match {i+1}: {fname} (ID: {cid}) - Similarity: {sim:.4f}")
        else:
            print("⚠️ No relevant documents found (0 chunks returned).")

    except Exception as e:
        print(f"Search failed (vector search error): {e}")
        # We might continue without context or return error
        # Assuming error means no match function exists yet
        
    # 3. Build Context
    context_text = ""
    if chunks:
        # Build context with metadata for LLM
        context_parts = []
        for c in chunks:
            meta_info = f"Document: {c.get('filename', 'Unknown')}\nChunk ID: {c.get('id', 'Unknown')}\nSimilarity: {c.get('similarity', 0):.4f}"
            content = c.get('content', '')
            context_parts.append(f"---\n{meta_info}\nContent:\n{content}\n---")
        
        context_text = "\n".join(context_parts)
    else:
        # If similarity search returns empty results, return specific message
        print("⚠️ No chunks found. Returning 'Answer not found'.")
        return {
            "reply": "Answer not found in provided RBI circulars."
        }
    
    # 4. Generate Answer (Groq - LLaMA3) with Strict System Prompt
    system_prompt = """You are an RBI Regulatory Compliance Assistant.

You must answer strictly and ONLY from the provided context.
Do NOT use external knowledge.
Do NOT assume anything.
Do NOT fabricate circular numbers.

If the answer is not found in the provided context,
respond exactly with:

"Answer not found in provided RBI circulars."

Always structure the response as:

Answer:
<precise answer extracted from context>

Source:
- Document: <filename>
- Extract: "<exact quoted sentence from context>"
"""

    user_message = f"""Context:
{context_text}

Question:
{question}
"""

    # Debug Log: Prompt Length
    print(f"🔹 Final Prompt Length: {len(system_prompt) + len(user_message)} chars")

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            model="llama-3.1-8b-instant", # Using Llama 3.1 8B Instant on Groq
            temperature=0.0, # Set to 0 for maximum determinism
            max_tokens=1024,
        )
        answer = chat_completion.choices[0].message.content
        
        return {
            "reply": answer
        }
        
    except Exception as e:
        print(f"Groq generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate answer.")
