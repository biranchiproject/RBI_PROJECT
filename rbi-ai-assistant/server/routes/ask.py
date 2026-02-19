from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from services.supabase_client import get_supabase
from pydantic import BaseModel
from services.embedding_service import generate_embedding
from groq import Groq
from services.slab_matcher import SlabMatcher
import os
import json
import asyncio
import re
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env"))
if not os.getenv("GROQ_API_KEY"):
    load_dotenv()
router = APIRouter()

# Clients
api_key = os.getenv("GROQ_API_KEY")
if api_key:
    try:
        # Initialize Groq for LLaMA generation
        groq_client = Groq(api_key=api_key)
        print("SUCCESS: Groq Client initialized successfully.")
    except Exception as e:
        print(f"ERROR: Groq Init Error: {e}")
        groq_client = None
else:
    print("WARNING: GROQ_API_KEY is missing in environment variables.")
    groq_client = None

class AskRequest(BaseModel):
    question: str

async def analyze_intent(text: str) -> dict:
    """
    Uses Groq to extract structured intent from the user query.
    Detects Categories, Numeric Limits, and Key Entities.
    """
    if not groq_client: return {}
    
    prompt = f"""Analyze this regulatory query and extract metadata in JSON:
Query: "{text}"

JSON Structure:
{{
  "category": "NBFC/Banking/Lending/Payments/Other",
  "numeric_limits": ["list", "of", "numbers"],
  "topics": ["list", "of", "topics"],
  "entities": ["Trust", "NBFC", "Bank", "Cooperative", "Company"],
  "logic_patterns": ["if", "provided", "subject to", "above", "below", "threshold"],
  "requested_page": "number or null"
}}
Return ONLY valid JSON.
"""
    try:
        res = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.1
        )
        data = json.loads(res.choices[0].message.content)
        
        # [Requirement 5] Latest Update Intent Detection
        update_keywords = ["latest update", "new notification", "recent circular", "today update", "what is new"]
        data["is_update_query"] = any(kw in text.lower() for kw in update_keywords)
        
        # Ensure requested_page is an int if possible
        if data.get("requested_page") and str(data["requested_page"]).isdigit():
            data["requested_page"] = int(data["requested_page"])
        else:
            data["requested_page"] = None
        return data
    except Exception as e:
        print(f"Intent analysis failed: {e}")
        return {}

async def fetch_page_tables(document_id: int, page_number: int):
    """
    Fetches structured tables for a specific page from document_tables.
    """
    try:
        supabase = get_supabase()
        res = supabase.table("document_tables") \
            .select("table_index, table_data") \
            .eq("document_id", document_id) \
            .eq("page_number", page_number) \
            .execute()
        return res.data or []
    except Exception as e:
        print(f"Failed to fetch tables: {e}")
        return []

def is_rbi_query(text: str) -> bool:
    """Lightweight check to see if query is RBI/Banking related."""
    rbi_keywords = [
        "rbi", "bank", "nbfc", "circular", "notification", "master direction",
        "loan", "limit", "kyc", "aml", "fema", "fpi", "basel", "crr", "slr",
        "repo", "reverse repo", "payment", "settlement", "audit", "compliance"
    ]
    text_lower = text.lower()
    return any(kw in text_lower for kw in rbi_keywords)

def format_metadata_block(meta: dict, page_num: int) -> str:
    """Formats a small metadata block for the beginning of context."""
    return f"DOC: {meta.get('title', 'Unknown')} | Page: {page_num}"

def verify_table_compliance(answer: str, rows: list) -> bool:
    """Checks if the LLM output contains all values from the structured rows."""
    if not rows: return True
    return SlabMatcher.verify_column_integrity(rows, answer)

def extract_best_context(full_text: str, query: str) -> str:
    """Heuristic to extract the most relevant paragraph from full page text."""
    paragraphs = [p.strip() for p in full_text.split('\n\n') if len(p.strip()) > 50]
    if not paragraphs: return full_text[:2000]
    
    # Simple keyword match scoring
    best_p = paragraphs[0]
    max_score = 0
    query_words = set(query.lower().split())
    
    for p in paragraphs:
        p_words = set(p.lower().split())
        score = len(query_words.intersection(p_words))
        if score > max_score:
            max_score = score
            best_p = p
    return best_p

def detect_best_page(initial_hits: list, requested_page: int = None) -> int:
    """Identifies the most relevant page from search hits."""
    if requested_page: return requested_page
    if not initial_hits: return 1
    
    # Priority 1: Page with highest similarity hit
    best_hit = max(initial_hits, key=lambda x: x.get('similarity', 0))
    return best_hit.get('page_number', 1)

def check_update_intent(text: str) -> bool:
    """Priority 1: Keyword-based detection for latest updates."""
    keywords = ["latest rbi update", "new rbi update", "recent circular", "today rbi update", "latest notification"]
    text_lower = text.lower()
    return any(kw in text_lower for kw in keywords)

def get_formatted_updates():
    """Fetches latest 5 records from rbi_updates and formats message."""
    try:
        supabase = get_supabase()
        updates = supabase.table("rbi_updates").select("*").order("publish_date", desc=True).limit(5).execute()
        if not updates.data:
            return "No new RBI updates found in the system."
            
        msg = "# [Latest RBI Updates]\n\n"
        for up in updates.data:
            msg += f"### {up['title']}\n"
            msg += f"- **Publish Date:** {up['publish_date']}\n"
            msg += f"- **Summary:** {up['summary']}\n"
            msg += f"- **Link:** [View Details]({up['url']})\n\n"
        return msg
    except Exception as e:
        print(f"ERROR: Update retrieval failed: {e}")
        return "Error retrieving latest updates. Please try again later."

def log_query(query: str, response_type: str, page_number: int = None):
    """Logs the query into Supabase query_logs table."""
    try:
        supabase = get_supabase()
        supabase.table("query_logs").insert({
            "query": query,
            "response_type": response_type,
            "page_number": page_number,
            "timestamp": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        print(f"Logging failed: {e}")

@router.post("/ask/stream")
async def ask_question_stream(request: AskRequest):
    if not groq_client: 
        raise HTTPException(status_code=503, detail="AI services not available.")

    question = request.question
    
    # 0. High-Priority Update Intent Check
    if check_update_intent(question):
        log_query(question, "update")
        async def update_gen():
            yield f"data: {json.dumps({'text': get_formatted_updates(), 'citations': []})}\n\n"
        return StreamingResponse(update_gen(), media_type="text/event-stream")

    # 1. Start Intent Analysis and Embedding in Parallel
    intent_task = asyncio.create_task(analyze_intent(question))
    embedding_task = asyncio.to_thread(generate_embedding, question)
    
    intent = await intent_task
    question_embedding = await embedding_task
    
    # 2. Vector Search
    supabase = get_supabase()
    try:
        res = supabase.rpc("match_documents", {
            "query_embedding": question_embedding,
            "match_threshold": 0.20,
            "match_count": 8
        }).execute()
        initial_hits = res.data or []
    except Exception as e:
        print(f"Search failed: {e}")
        initial_hits = []

    if not initial_hits:
        # Restricted Scope Check
        if not is_rbi_query(question):
            log_query(question, "off-scope")
            async def off_scope_gen():
                yield f"data: {json.dumps({'text': 'I can only assist with official RBI regulatory queries. Please provide a relevant query.'})}\n\n"
            return StreamingResponse(off_scope_gen(), media_type="text/event-stream")
        
        log_query(question, "no-context")
        async def no_context_gen():
            yield f"data: {json.dumps({'text': 'Answer not found in provided RBI circulars.'})}\n\n"
        return StreamingResponse(no_context_gen(), media_type="text/event-stream")

    # 3. [Phase 1 & 2] Re-ranking & Page Lock Mode
    best_page = detect_best_page(initial_hits, intent.get('requested_page'))
    doc_id_involved = initial_hits[0].get('document_id')
    
    # Limits search to ONLY the best page
    final_context_chunks = [h for h in initial_hits if h.get('page_number') == best_page and h.get('document_id') == doc_id_involved]
    if not final_context_chunks:
        final_context_chunks = initial_hits[:3] # Fallback
    
    # Fetch Doc Metadata
    unique_doc_ids = list(set(c.get('document_id') for c in final_context_chunks))
    doc_meta_map = {}
    if unique_doc_ids:
        doc_res = supabase.table("documents").select("*").in_("id", unique_doc_ids).execute()
        doc_meta_map = {d['id']: d for d in doc_res.data}

    # 4. slab matcher Logic
    structured_data_context = ""
    matching_rows = []
    label_found_in_page = True
    parsing_failed = False
    try:
        if best_page and final_context_chunks:
             doc_id = final_context_chunks[0].get('document_id')
             query_numbers = SlabMatcher.extract_query_numbers(question)
             query_labels = SlabMatcher.extract_query_labels(question)
             
             page_tables = await fetch_page_tables(doc_id, best_page)
             
             if page_tables:
                 matching_rows = SlabMatcher.find_matching_rows(page_tables, query_numbers, query_labels)
                 
                 if query_labels and not matching_rows:
                     label_found_in_page = False
                     print(f"WARNING: [Deterministic Fail] Requested Label(s) {query_labels} not found on Page {best_page}")
                 
                 if matching_rows:
                     # [Requirement 5] Header Validation
                     if not SlabMatcher.has_valid_headers(matching_rows):
                         # Try fallback parsing before giving up
                         all_chunk_text = "\n".join([c.get('content', '') for c in final_context_chunks])
                         fallback_table = SlabMatcher.parse_inline_table(all_chunk_text) or SlabMatcher.parse_raw_text_table(all_chunk_text)
                         
                         if fallback_table:
                             structured_data_context = "\n### [EXACT TABLE MATCHES FOUND]\n"
                             for row in fallback_table["rows"]:
                                 structured_data_context += f"- Table Columns: {fallback_table['headers']}\n"
                                 structured_data_context += f"- Row Content: {row}\n"
                             print("SUCCESS: Fallback parser found table data!")
                             parsing_failed = False
                         else:
                            parsing_failed = True
                            print(f"DEBUG: Header mapping failed for table on Page {best_page}")
                     else:
                         structured_data_context = "\n### [EXACT TABLE MATCHES FOUND]\n"
                         for match in matching_rows:
                             structured_data_context += f"- Table Columns: {match['headers']}\n"
                             structured_data_context += f"- Row Content: {match['row_content']}\n"
                         print(f"SUCCESS: Slab Matcher found {len(matching_rows)} relevant rows!")
                 else:
                     # Check if raw text contains a table despite no row matching
                     all_chunk_text = "\n".join([c.get('content', '') for c in final_context_chunks])
                     fallback_table = SlabMatcher.parse_inline_table(all_chunk_text) or SlabMatcher.parse_raw_text_table(all_chunk_text)
                     if fallback_table:
                         structured_data_context = "\n### [EXACT TABLE MATCHES FOUND]\n"
                         for row in fallback_table["rows"]:
                             structured_data_context += f"- Table Columns: {fallback_table['headers']}\n"
                             structured_data_context += f"- Row Content: {row}\n"
                         print("SUCCESS: Final fallback parser found table data!")

    except Exception as table_e:
        print(f"ERROR: Slab matching failed: {table_e}")

    # Build Citations
    citations = []
    cited_pages = set()
    for c in final_context_chunks:
        d_id = c.get('document_id')
        meta = doc_meta_map.get(d_id, {})
        page_key = f"{d_id}_{c.get('page_number', 'N/A')}"
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

    full_page_text = "\n\n".join([c.get('content', '') for c in final_context_chunks])
    best_paragraph = extract_best_context(full_page_text, question)
    
    # 5. Build Final Context
    first_chunk = final_context_chunks[0] if final_context_chunks else {}
    doc_id = first_chunk.get('document_id')
    meta = doc_meta_map.get(doc_id, {})
    meta_header = f"DOC: {meta.get('title', 'Unknown')} | Page: {best_page}"
    
    if structured_data_context:
        context_text = f"{meta_header}\n\n[STRICT TABLE MODE ACTIVE]\n\n{structured_data_context}\n---"
    else:
        context_text = f"{meta_header}\nContent: {best_paragraph}\n---"

    async def stream_generator():
        yield f"data: {json.dumps({'citations': citations})}\n\n"
        
        try:
            # Deterministic Error Handling
            if parsing_failed:
                error_response = "# [Parsing Error]\n\nStructured table parsing failed on this page."
                yield f"data: {json.dumps({'text': error_response})}\n\n"
                return

            if not label_found_in_page:
                msg = f"Requested internal table label not found on Page {best_page}. I am restricted to providing information only from the detected page."
                error_response = f"# [Label Not Found]\n\n{msg}"
                yield f"data: {json.dumps({'text': error_response})}\n\n"
                return

            if not best_page:
                yield f"data: {json.dumps({'error': 'CRITICAL: Unable to detect a valid page number.'})}\n\n"
                return

            # Max 2 attempts for verification
            max_retries = 2
            is_table_mode = bool(structured_data_context)
            final_response = ""
            
            for attempt in range(max_retries):
                system_prompt = f"""You are an RBI Regulatory Specialist. Answer ONLY from the provided context.
                
                [STRICT FORMATTING]
                1. ## [Topic Name]
                2. **Cohesive Summary**: 1-2 sentences.
                3. **Structured Details**: List rules accurately. Include column headers.
                4. **⚖️ Legal Context**: Quote relevant acts.
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
                
                current_attempt_text = ""
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        token = chunk.choices[0].delta.content
                        current_attempt_text += token
                        yield f"data: {json.dumps({'text': token})}\n\n"
                
                # Verification logic (Phase 3)
                if is_table_mode and matching_rows:
                    if not verify_table_compliance(current_attempt_text, matching_rows):
                        print(f"WARNING: Verification failed (Attempt {attempt+1})")
                        if attempt < max_retries - 1:
                            recovery_msg = json.dumps({'text': '\n\n---\n*🔄 Automating data recovery...*\n\n'})
                            yield f"data: {recovery_msg}\n\n"
                            continue
                        else:
                            recovered_text = SlabMatcher.append_missing_columns(matching_rows, current_attempt_text)
                            yield f"data: {json.dumps({'text': recovered_text.replace(current_attempt_text, '')})}\n\n"
                break

            log_query(question, "stream_success", best_page)
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

@router.post("/ask")
async def ask_question(request: AskRequest):
    if not groq_client: 
        raise HTTPException(status_code=503, detail="AI services not available.")

    question = request.question
    
    # 0. Update Intent Check
    if check_update_intent(question):
        log_query(question, "update")
        return {"answer": get_formatted_updates(), "citations": []}

    # 1. Start Intent Analysis and Embedding
    intent_task = asyncio.create_task(analyze_intent(question))
    embedding_task = asyncio.to_thread(generate_embedding, question)
    
    intent = await intent_task
    question_embedding = await embedding_task
    
    # 2. Vector Search
    supabase = get_supabase()
    try:
        res = supabase.rpc("match_documents", {
            "query_embedding": question_embedding,
            "match_threshold": 0.20,
            "match_count": 8
        }).execute()
        initial_hits = res.data or []
    except Exception as e:
        print(f"Search failed: {e}")
        initial_hits = []

    if not initial_hits:
        if not is_rbi_query(question):
            log_query(question, "off-scope")
            return {"answer": "I can only assist with official RBI regulatory queries.", "citations": []}
        return {"answer": "Answer not found in provided RBI circulars.", "citations": []}

    # 3. [Phase 1 & 2] Page Lock Mode
    best_page = detect_best_page(initial_hits, intent.get('requested_page'))
    doc_id_involved = initial_hits[0].get('document_id')
    final_context_chunks = [h for h in initial_hits if h.get('page_number') == best_page and h.get('document_id') == doc_id_involved]
    if not final_context_chunks:
        final_context_chunks = initial_hits[:3]

    unique_doc_ids = list(set(c.get('document_id') for c in final_context_chunks))
    doc_res = supabase.table("documents").select("*").in_("id", unique_doc_ids).execute()
    doc_meta_map = {d['id']: d for d in doc_res.data}

    # 4. Slab Matcher
    structured_data_context = ""
    matching_rows = []
    label_found_in_page = True
    parsing_failed = False
    try:
        if best_page and final_context_chunks:
             doc_id = final_context_chunks[0].get('document_id')
             query_numbers = SlabMatcher.extract_query_numbers(question)
             query_labels = SlabMatcher.extract_query_labels(question)
             page_tables = await fetch_page_tables(doc_id, best_page)
             
             if page_tables:
                 matching_rows = SlabMatcher.find_matching_rows(page_tables, query_numbers, query_labels)
                 if query_labels and not matching_rows:
                     label_found_in_page = False
                 
                 if matching_rows:
                     if not SlabMatcher.has_valid_headers(matching_rows):
                         all_chunk_text = "\n".join([c.get('content', '') for c in final_context_chunks])
                         fallback_table = SlabMatcher.parse_inline_table(all_chunk_text) or SlabMatcher.parse_raw_text_table(all_chunk_text)
                         if fallback_table:
                             structured_data_context = "\n### [EXACT TABLE MATCHES FOUND]\n"
                             for row in fallback_table["rows"]:
                                 structured_data_context += f"- Table Columns: {fallback_table['headers']}\n"
                                 structured_data_context += f"- Row Content: {row}\n"
                             parsing_failed = False
                         else:
                            parsing_failed = True
                     else:
                         structured_data_context = "\n### [EXACT TABLE MATCHES FOUND]\n"
                         for match in matching_rows:
                             structured_data_context += f"- Table Columns: {match['headers']}\n"
                             structured_data_context += f"- Row Content: {match['row_content']}\n"
                 else:
                     all_chunk_text = "\n".join([c.get('content', '') for c in final_context_chunks])
                     fallback_table = SlabMatcher.parse_inline_table(all_chunk_text) or SlabMatcher.parse_raw_text_table(all_chunk_text)
                     if fallback_table:
                         structured_data_context = "\n### [EXACT TABLE MATCHES FOUND]\n"
                         for row in fallback_table["rows"]:
                             structured_data_context += f"- Table Columns: {fallback_table['headers']}\n"
                             structured_data_context += f"- Row Content: {row}\n"

    except Exception as table_e:
        print(f"ERROR: Slab matching failed: {table_e}")

    # Deterministic Errors
    if parsing_failed:
        error_response = "# [Parsing Error]\n\nStructured table parsing failed on this page."
        return {"answer": error_response, "citations": []}

    if not label_found_in_page:
        msg = f"Requested internal table label not found on Page {best_page}."
        return {"answer": f"# [Label Not Found]\n\n{msg}", "citations": []}

    # 5. Build Final Context & Synthesis
    citations = []
    cited_pages = set()
    for c in final_context_chunks:
        d_id = c.get('document_id')
        meta = doc_meta_map.get(d_id, {})
        page_key = f"{d_id}_{c.get('page_number', 'N/A')}"
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

    full_page_text = "\n\n".join([c.get('content', '') for c in final_context_chunks])
    best_paragraph = extract_best_context(full_page_text, question)
    
    first_chunk = final_context_chunks[0] if final_context_chunks else {}
    doc_id = first_chunk.get('document_id')
    meta = doc_meta_map.get(doc_id, {})
    meta_header = f"DOC: {meta.get('title', 'Unknown')} | Page: {best_page}"
    
    if structured_data_context:
        context_text = f"{meta_header}\n\n[STRICT TABLE MODE ACTIVE]\n\n{structured_data_context}\n---"
    else:
        context_text = f"{meta_header}\nContent: {best_paragraph}\n---"

    try:
        system_prompt = "You are an RBI Regulatory Specialist. Answer ONLY from context. Use ## Topic, Cohesive Summary, Structured Details, Legal Context."
        res = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion:\n{question}"}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.0
        )
        answer = res.choices[0].message.content
        log_query(question, "success", best_page)
        return {"answer": answer, "citations": citations}
    except Exception as e:
        print(f"Synthesis failed: {e}")
        return {"answer": "Generation failed. Please try again.", "citations": []}
