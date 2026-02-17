from fastapi import APIRouter, HTTPException, Body
from services.supabase_client import get_supabase
from pydantic import BaseModel
from services.embedding_service import generate_embedding
from groq import Groq
import os
import json
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
    
    # NEW: Analyze Query Intent for Hybrid Filtering
    intent = {"category": None, "amount": None, "topic": None}
    try:
        print(f"🧠 Analyzing intent for: '{question}'")
        intent_prompt = f"""
        Analyze the following RBI query and extract metadata filters in JSON format.
        Focus on:
        - "category": (e.g., NBFC, Bank, Lending, KYC, Fintech)
        - "amount": (any specific numeric limits mentioned)
        - "topic": (core theme)

        Return ONLY JSON.
        Example Question: "What are the rules for NBFCs over 50,000?"
        Result: {{"category": "NBFC", "amount": "50,000", "topic": "rules"}}

        Question: "{question}"
        Result:"""
        
        intent_res = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": intent_prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.0,
            max_tokens=100,
            response_format={"type": "json_object"}
        )
        intent = json.loads(intent_res.choices[0].message.content)
        print(f"📊 Extracted Intent: {intent}")
    except Exception as e:
        print(f"⚠️ Intent analysis failed (using default): {e}")

    # 1. Embed Question
    try:
        # Run synchronous generate_embedding directly
        question_embedding = generate_embedding(question)
    except Exception as e:
        print(f"Embedding error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate embedding.")

    # 2. Vector Search with Dynamic Tiering
    supabase = get_supabase()
    
    # Tiered Threshold Search for maximum reliability
    # High: 0.60 | Medium: 0.40 | Low: 0.20
    threshold_tiers = [
        {"thresh": 0.60, "count": 3}, # High confidence, small specific hits
        {"thresh": 0.40, "count": 5}, # Medium confidence, standard context
        {"thresh": 0.20, "count": 7}  # Low confidence, broad context
    ]

    initial_chunks = []
    try:
        current_data = []
        for tier in threshold_tiers:
            thresh = tier["thresh"]
            count = tier["count"]
            print(f"🔍 Searching with threshold: {thresh}...")
            rpc_res = supabase.rpc("match_documents", {
                "query_embedding": question_embedding,
                "match_threshold": thresh,
                "match_count": count
            }).execute()
            
            if rpc_res.data:
                current_data = rpc_res.data
                print(f"✅ Found {len(current_data)} hits at {thresh} threshold.")
                break 
            else:
                print(f"⚠️ No results at {thresh} threshold.")
        initial_chunks = current_data
    except Exception as e:
        print(f"❌ Initial vector search failed: {e}")
        initial_chunks = []

    # 3. Context Expansion (Fetch Neighbors)
    final_context_chunks = []
    if initial_chunks:
        print(f"🧠 Expanding context for {len(initial_chunks)} hits...")
        expanded_chunk_ids = set()
        
        for hit in initial_chunks:
            doc_id = hit.get('document_id')
            idx = hit.get('chunk_index')
            if doc_id is None or idx is None:
                final_context_chunks.append(hit)
                continue
                
            # Fetch context window: [idx-1, idx, idx+1]
            try:
                window_res = supabase.table("document_chunks") \
                    .select("id, content, chunk_index, document_id, page_number") \
                    .eq("document_id", doc_id) \
                    .gte("chunk_index", max(0, idx - 1)) \
                    .lte("chunk_index", idx + 1) \
                    .execute()
                
                if window_res.data:
                    for w_chunk in window_res.data:
                        # Use document_id + chunk_index as a unique key for deduplication
                        unique_key = f"{doc_id}_{w_chunk['chunk_index']}"
                        if unique_key not in expanded_chunk_ids:
                            # Attach similarity for sorting if it's the primary hit
                            if w_chunk['chunk_index'] == idx:
                                w_chunk['similarity'] = hit.get('similarity', 0)
                            else:
                                w_chunk['similarity'] = hit.get('similarity', 0) * 0.9 # Slightly lower weight for context
                            
                            final_context_chunks.append(w_chunk)
                            expanded_chunk_ids.add(unique_key)
            except Exception as e:
                print(f"⚠️ Neighbor fetch failed for doc {doc_id} idx {idx}: {e}")
                final_context_chunks.append(hit)

        # Sort by document then index for logical merging
        final_context_chunks.sort(key=lambda x: (x.get('document_id', ''), x.get('chunk_index', 0)))
        print(f"✅ Context window expanded to {len(final_context_chunks)} logical units.")
    else:
        print("⚠️ No chunks found. Returning 'Answer not found'.")
        return {
            "answer": "Answer not found in provided RBI circulars.",
            "citations": []
        }

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
