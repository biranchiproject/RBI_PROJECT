from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from services.supabase_client import get_supabase
from pydantic import BaseModel
from services.embedding_service import generate_embedding
from groq import Groq
import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# Clients
api_key = os.getenv("GROQ_API_KEY")
if api_key:
    try:
        # Initialize Groq for LLaMA generation
        groq_client = Groq(api_key=api_key)
        print("✅ Groq Client initialized successfully.")
    except Exception as e:
        print(f"❌ Groq Init Error: {e}")
        groq_client = None
else:
    print("⚠️ WARNING: GROQ_API_KEY is missing in environment variables.")
    groq_client = None

class AskRequest(BaseModel):
    question: str

@router.post("/ask/stream")
async def ask_question_stream(request: AskRequest):
    if not groq_client:
        raise HTTPException(status_code=503, detail="AI services not available. Check API keys.")

    question = request.question
    
    # 1. Embed and Search (Reuse optimized logic)
    question_embedding = generate_embedding(question)
    supabase = get_supabase()
    
    try:
        rpc_res = supabase.rpc("match_documents", {
            "query_embedding": question_embedding,
            "match_threshold": 0.20,
            "match_count": 10
        }).execute()
        initial_hits = rpc_res.data or []
    except Exception as e:
        print(f"❌ Search failed: {e}")
        initial_hits = []

    if not initial_hits:
        async def empty_gen():
            yield f"data: {json.dumps({'answer': 'Answer not found in provided RBI circulars.', 'citations': []})}\n\n"
        return StreamingResponse(empty_gen(), media_type="text/event-stream")

    # Batch context expansion
    final_context_chunks = []
    doc_meta_map = {}
    try:
        involved_doc_ids = list(set(hit.get('document_id') for hit in initial_hits if hit.get('document_id')))
        if involved_doc_ids:
            # Parallel fetch would be better, but sequential for now is already fast
            chunks_res = supabase.table("document_chunks") \
                .select("id, content, chunk_index, document_id, page_number") \
                .in_("document_id", involved_doc_ids) \
                .execute()
            
            doc_res = supabase.table("documents").select("*").in_("id", involved_doc_ids).execute()
            
            if chunks_res.data:
                chunk_map = {(c['document_id'], c['chunk_index']): c for c in chunks_res.data}
                dedup_keys = set()
                for hit in initial_hits:
                    doc_id, idx = hit.get('document_id'), hit.get('chunk_index')
                    if doc_id and idx is not None:
                        for i in [idx - 1, idx, idx + 1]:
                            if i < 0: continue
                            key = (doc_id, i)
                            if key in chunk_map and key not in dedup_keys:
                                c_data = chunk_map[key]
                                c_data['similarity'] = hit.get('similarity', 0) if i == idx else hit.get('similarity', 0) * 0.9
                                final_context_chunks.append(c_data)
                                dedup_keys.add(key)
            if doc_res.data:
                doc_meta_map = {d['id']: d for d in doc_res.data}
    except Exception as e:
        print(f"⚠️ Batch expansion failed: {e}")
        final_context_chunks = initial_hits

    # Build context and citations
    context_parts = []
    citations = []
    cited_pages = set()
    for c in final_context_chunks:
        doc_id = c.get('document_id')
        meta = doc_meta_map.get(doc_id, {})
        meta_header = f"📄 Document: {meta.get('title', 'Unknown')} | Page: {c.get('page_number', 'N/A')}"
        context_parts.append(f"{meta_header}\nContent: {c.get('content', '')}\n---")
        
        page_key = f"{doc_id}_{c.get('page_number', 'N/A')}"
        if page_key not in cited_pages:
            citations.append({
                "title": meta.get('title', 'Unknown'),
                "filename": meta.get('filename', 'Unknown'),
                "category": meta.get('category', 'General'),
                "page_number": c.get('page_number', 'N/A'),
                "upload_date": str(meta.get('upload_date', '')).split("T")[0],
                "extract": c.get('content', '')
            })
            cited_pages.add(page_key)

    context_text = "\n".join(context_parts)
    
    async def stream_generator():
        # First send the citations
        yield f"data: {json.dumps({'citations': citations})}\n\n"
        
        try:
            # Full structured prompt restored for premium UI formatting
            system_prompt = f"""You are an RBI Regulatory Intelligence Specialist.
Your goal is to provide precise, structured, and legally accurate answers based ONLY on the provided RBI circular extracts.

INSTRUCTION FOR SYNTHESIS:
- Synthesize a cohesive answer based on the provided context.
- Maintain a highly professional, authoritative, and formal tone (RBI-grade).

FORMATTING RULES (STRICT):
1. **Answer Title**: Start with a bold, professional heading.
2. **Cohesive Summary**: Provide a 2-3 sentence overview of the regulation.
3. **Structured Details**: Use bullet points ("-") for specific guidelines or conditions.
4. **⚖️ Legal Context**: Highlight any Acts (e.g., BR Act, FEMA, PML Act) in this section.

CRITICAL: 
- DO NOT generate a "Source Details" or "Extract" text block at the end. 
- The citation information is handled by the UI system automatically.
- Your response should end immediately after the Answer or Legal Context section.

If the answer is definitely not in the context: "Answer not found in provided RBI circulars."
"""
            stream = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion:\n{question}"}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.0,
                max_tokens=1024,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield f"data: {json.dumps({'text': chunk.choices[0].delta.content})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

@router.post("/ask")
async def ask_question(request: AskRequest):
    if not groq_client:
        raise HTTPException(status_code=503, detail="AI services not available. Check API keys.")

    question = request.question
    
    # Remove redundant intent analysis for speed
    # Intent analysis can be handled by the main LLM call with context
    intent = {"category": None, "amount": None, "topic": None}

    # 1. Embed Question
    try:
        # Run synchronous generate_embedding directly
        question_embedding = generate_embedding(question)
    except Exception as e:
        print(f"Embedding error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate embedding.")

    # 2. Optimized Vector Search
    supabase = get_supabase()
    
    # Use a single call with a lower threshold and reasonable limit
    # We sort by similarity in-memory for finer control if needed
    try:
        print(f"🔍 Searching with 0.20 threshold...")
        rpc_res = supabase.rpc("match_documents", {
            "query_embedding": question_embedding,
            "match_threshold": 0.20,
            "match_count": 10
        }).execute()
        
        initial_hits = rpc_res.data or []
        print(f"✅ Found {len(initial_hits)} raw hits.")
    except Exception as e:
        print(f"❌ Vector search failed: {e}")
        initial_hits = []

    if not initial_hits:
        return {"answer": "Answer not found in provided RBI circulars.", "citations": []}

    # 3. Batch Context Expansion (Fetch all neighbors in one query)
    final_context_chunks = []
    try:
        # Collect IDs and indices
        search_targets = []
        for hit in initial_hits:
            doc_id = hit.get('document_id')
            idx = hit.get('chunk_index')
            if doc_id and idx is not None:
                # Add range [idx-1, idx, idx+1]
                search_targets.append((doc_id, idx))
        
        if search_targets:
            # Prepare a list of OR conditions or just fetch all chunks for these documents
            # For simplicity and performance, we fetch chunks in the specific index ranges
            # Build a filter for (doc_id, chunk_index)
            # Since Supabase Python client doesn't support complex tuples easily, 
            # we'll fetch all chunks for the involved documents and filter in memory
            # OR better: run a specific batch query if many docs, but usually it's 1-3 docs.
            
            involved_doc_ids = list(set(d for d, i in search_targets))
            print(f"🧠 Batch fetching neighbors for {len(involved_doc_ids)} documents...")
            
            # Fetch all potentially relevant chunks in one go
            all_chunks_res = supabase.table("document_chunks") \
                .select("id, content, chunk_index, document_id, page_number") \
                .in_("document_id", involved_doc_ids) \
                .execute()
            
            if all_chunks_res.data:
                # Group by doc_id and chunk_index for fast lookup
                chunk_map = {}
                for c in all_chunks_res.data:
                    chunk_map[(c['document_id'], c['chunk_index'])] = c
                
                dedup_keys = set()
                for d_id, idx in search_targets:
                    # Original hit similarity for boosting calculation
                    orig_similarity = next((h.get('similarity', 0) for h in initial_hits if h['document_id'] == d_id and h['chunk_index'] == idx), 0)
                    
                    for i in [idx - 1, idx, idx + 1]:
                        if i < 0: continue
                        key = (d_id, i)
                        if key in chunk_map and key not in dedup_keys:
                            chunk_data = chunk_map[key]
                            chunk_data['similarity'] = orig_similarity if i == idx else orig_similarity * 0.9
                            final_context_chunks.append(chunk_data)
                            dedup_keys.add(key)
        else:
            final_context_chunks = initial_hits
    except Exception as e:
        print(f"⚠️ Batch expansion failed: {e}")
        final_context_chunks = initial_hits

    # 4. Meta-Metadata Pre-fetching & Citation Building
    doc_meta_map = {}
    unique_doc_ids = list(set(c.get('document_id') for c in final_context_chunks if c.get('document_id')))
    if unique_doc_ids:
        try:
            doc_res = supabase.table("documents").select("*").in_("id", unique_doc_ids).execute()
            if doc_res.data:
                doc_meta_map = {d['id']: d for d in doc_res.data}
        except Exception as e:
            print(f"⚠️ Metadata lookup failed: {e}")

    # NEW: Hybrid Prioritization (Metadata Boost)
    print(f"🚀 Boosting results based on intent: {intent}")
    for c in final_context_chunks:
        doc_id = c.get('document_id')
        meta = doc_meta_map.get(doc_id, {})
        content = c.get('content', '').lower()
        
        # Category Boost
        if intent.get('category'):
            cat_target = intent['category'].lower()
            if cat_target in meta.get('category', '').lower() or cat_target in meta.get('title', '').lower():
                c['similarity'] = c.get('similarity', 0) + 0.15 # Strong boost for category match
                print(f"   🔝 Boosted (Category): {meta.get('title')}")
        
        # Amount/Threshold Boost
        if intent.get('amount'):
            amt_target = str(intent['amount']).replace(",", "")
            if amt_target in content.replace(",", ""):
                c['similarity'] = c.get('similarity', 0) + 0.20 # Higher boost for exact numeric matches
                print(f"   🔝 Boosted (Amount): {amt_target} found in chunk")

    # Re-sort after boosting
    final_context_chunks.sort(key=lambda x: x.get('similarity', 0), reverse=True)

    context_parts = []
    citations = []
    
    # Final grouping into logical blocks for the LLM
    cited_pages = set() # Track (doc_id, page_number) to avoid duplicate citations for same page
    
    for c in final_context_chunks:
        doc_id = c.get('document_id')
        page_num = c.get('page_number', 'N/A')
        meta = doc_meta_map.get(doc_id, {})
        
        # Build citation for UI (Deduplicate by Document + Page)
        page_key = f"{doc_id}_{page_num}"
        if page_key not in cited_pages:
            title = meta.get('title', 'Unknown')
            fname = meta.get('filename', 'Unknown')
            category = meta.get('category', 'General')
            upload_date = meta.get('upload_date', 'Unknown Date')
            if upload_date and "T" in str(upload_date):
                upload_date = str(upload_date).split("T")[0]

            citations.append({
                "title": title,
                "filename": fname,
                "category": category,
                "page_number": page_num,
                "similarity": round(float(c.get('similarity', 0)), 4),
                "upload_date": upload_date,
                "extract": c.get('content', '') 
            })
            cited_pages.add(page_key)

        # Formatting for LLM Context
        meta_header = f"📄 Document: {meta.get('title', 'Unknown')} | Category: {meta.get('category', 'General')} | Page: {c.get('page_number', 'N/A')}"
        context_parts.append(f"{meta_header}\nContent: {c.get('content', '')}\n---")

    context_text = "\n".join(context_parts)
    
    # 5. Generate Answer (Groq - LLaMA3) with Intent-Aware Synthesis
    intent_context = f"User Intent: {intent}"
    system_prompt = f"""You are an RBI Regulatory Intelligence Specialist.
    Your goal is to provide precise, structured, and legally accurate answers based ONLY on the provided RBI circular extracts.

    HYBRID CONTEXT:
    {intent_context}
    
    INSTRUCTION FOR SYNTHESIS:
    - User is specifically interested in the intent categories/numbers mentioned above.
    - If multiple documents are present, prioritize the ones matching the 'User Intent'.
    - Synthesize a cohesive answer. 
    - Maintain a highly professional, authoritative, and formal tone (RBI-grade).

    FORMATTING RULES (STRICT):
    1. **Answer Title**: Start with a bold, professional heading.
    2. **Cohesive Summary**: Provide a 2-3 sentence overview of the regulation.
    3. **Structured Details**: Use bullet points ("-") for specific guidelines or conditions.
    4. **⚖️ Legal Context**: Highlight any Acts (e.g., BR Act, FEMA, PML Act) in this section.
    
    CRITICAL: 
    - DO NOT generate a "Source Details" or "Extract" text block at the end. 
    - The citation information is handled by the UI system automatically.
    - Your response should end immediately after the Answer or Legal Context section.

    If the answer is definitely not in the context: "Answer not found in provided RBI circulars."
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
        generated_answer = chat_completion.choices[0].message.content
        
        return {
            "answer": generated_answer,
            "citations": citations
        }
        
    except Exception as e:
        print(f"Groq generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate answer.")
