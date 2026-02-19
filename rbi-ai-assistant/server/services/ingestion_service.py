import os
import uuid
import io
import asyncio
from datetime import datetime
import fitz
import pdfplumber
from services.supabase_client import get_supabase
from services.embedding_service import generate_embedding

async def ingest_rbi_document(file_content: bytes, filename: str, title: str, category: str = "Live Update"):
    """
    Ingests a document bytes into the system (Storage, DB, Chunks, Embeddings).
    Specifically for the live update scraper.
    """
    try:
        supabase = get_supabase()
        BUCKET_NAME = "rbi-documents"
        
        # 1. Upload to Storage
        unique_filename = f"live_{uuid.uuid4()}.pdf"
        supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=file_content,
            file_options={"content-type": "application/pdf"}
        )
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)
        
        # 2. Extract Text
        full_text = ""
        pages_content = []
        with fitz.open(stream=file_content, filetype="pdf") as doc:
            total_pages = len(doc)
            for page_num, page in enumerate(doc):
                text = page.get_text()
                full_text += text
                pages_content.append({"text": text, "page_number": page_num + 1})

        # 3. Insert Document Record
        doc_data = {
            "filename": filename,
            "file_path": public_url,
            "upload_date": datetime.utcnow().isoformat(),
            "category": category,
            "title": title,
            "total_pages": total_pages
        }
        res = supabase.table("documents").insert(doc_data).execute()
        if not res.data:
            raise Exception("Failed to insert document record")
        
        document_id = res.data[0]['id']
        
        # 4. Process Chunks (Parallel)
        await process_chunks(document_id, pages_content)
        
        return document_id

    except Exception as e:
        print(f"ERROR: Ingestion failed: {e}")
        return None

async def process_chunks(document_id: int, pages_content: list):
    supabase = get_supabase()
    all_chunks = []
    
    def chunk_text(text, size=1200, overlap=200):
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + size, len(text))
            chunks.append(text[start:end])
            if end == len(text): break
            start += (size - overlap)
        return chunks

    idx = 0
    tasks = []
    for page in pages_content:
        chunks = chunk_text(page['text'])
        for chunk in chunks:
            tasks.append(process_single_chunk(document_id, chunk, page['page_number'], idx))
            idx += 1
            
    chunk_rows = await asyncio.gather(*tasks)
    chunk_rows = [r for r in chunk_rows if r]
    
    # Batch Insert
    for i in range(0, len(chunk_rows), 50):
        supabase.table("document_chunks").insert(chunk_rows[i:i+50]).execute()

async def process_single_chunk(doc_id, text, page_num, idx):
    try:
        embedding = await asyncio.to_thread(generate_embedding, text)
        return {
            "document_id": doc_id,
            "content": text,
            "embedding": embedding,
            "page_number": page_num,
            "chunk_index": idx
        }
    except:
        return None
