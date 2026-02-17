from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import uuid
import os
from datetime import datetime
from services.supabase_client import get_supabase
import fitz # PyMuPDF
import pdfplumber
import io
from services.embedding_service import generate_embedding
from dotenv import load_dotenv
import asyncio
import json

load_dotenv()

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_MIME_TYPES = ["application/pdf"]
BUCKET_NAME = "rbi-documents"

def table_to_markdown(table):
    """Converts a pdfplumber table (list of lists) to a GitHub-flavored Markdown table string."""
    if not table:
        return ""
    
    # Filter out empty rows and ensure all cells are strings
    clean_table = []
    for row in table:
        if any(row):  # Row has at least one non-None/non-empty cell
            clean_table.append([str(cell).strip() if cell is not None else "" for cell in row])
    
    if len(clean_table) < 2:  # Need at least a header and one row
        return ""

    md = "\n### [Tabular Data extracted]\n"
    # Header Row
    md += "| " + " | ".join(clean_table[0]) + " |\n"
    # Alignment/Separator Row
    md += "| " + " | ".join(["---"] * len(clean_table[0])) + " |\n"
    # Data Rows
    for row in clean_table[1:]:
        md += "| " + " | ".join(row) + " |\n"
    
    return md + "\n"


def chunk_text(text: str, chunk_size=1200, overlap=200):
    """
    Splits text into chunks of specified size with overlap.
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunks.append(text[start:end])
        
        if end == text_len:
            break
            
        start += (chunk_size - overlap)
    
    print(f"🔹 Chunking complete: {len(chunks)} chunks created.")
    return chunks



@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("General")
):
    """
    Upload a PDF file to Supabase Storage and create a database record.
    Also extracts text content from the PDF for indexing, chunks it, and generates embeddings.
    """
    print(f"\n🚀 Starting upload process for: {file.filename}")
    
    # 1. Validate File Type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Only PDF files are allowed."
        )

    # 2. Validate File Size
    try:
        content = await file.read()
        print(f"✅ File read into memory: {len(content)} bytes")
    except Exception as e:
        print(f"❌ Failed to read file: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail="File too large. Maximum size is 10MB."
        )

    
    # 3. Extract Text & Tables - Hybrid Approach
    full_text = ""
    pages_content = [] # List of {text, page_number}
    total_pages = 0
    
    try:
        print("🔹 Extracting text and searching for tables...")
        with pdfplumber.open(io.BytesIO(content)) as plub_doc:
            total_pages = len(plub_doc.pages)
            with fitz.open(stream=content, filetype="pdf") as fitz_doc:
                for page_num in range(len(fitz_doc)):
                    # Get page from both libraries
                    fitz_page = fitz_doc[page_num]
                    plub_page = plub_doc.pages[page_num]
                    
                    # 1. Base text from Fitz (fast and accurate for text)
                    text = fitz_page.get_text()
                    
                    # 2. Extract Tables from pdfplumber
                    tables = plub_page.extract_tables()
                    table_md = ""
                    for table in tables:
                        table_md += table_to_markdown(table)
                    
                    # 3. Append Markdown tables to text
                    if table_md:
                        print(f"   📊 Table found on page {page_num + 1}")
                        text += "\n" + table_md
                        
                    full_text += text
                    pages_content.append({
                        "text": text,
                        "page_number": page_num + 1 
                    })
                    
        print(f"✅ Enhanced extraction complete. {len(pages_content)} pages processed.")
    except Exception as e:
        print(f"❌ Enhanced extraction failed: {e}. Falling back to standard text extraction.")
        full_text = ""
        pages_content = []
        with fitz.open(stream=content, filetype="pdf") as doc:
            total_pages = len(doc)
            for page_num, page in enumerate(doc):
                text = page.get_text()
                full_text += text
                pages_content.append({
                    "text": text,
                    "page_number": page_num + 1 
                })
    
    # 4. Generate Unique Filename & Path
    file_extension = os.path.splitext(file.filename)[1] or ".pdf"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_size_kb = round(len(content) / 1024, 2)
    
    try:
        supabase = get_supabase()

        # 5. Upload to Supabase Storage
        print("🔹 Uploading to Supabase Storage...")
        supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=content,
            file_options={"content-type": "application/pdf"}
        )
        print("✅ File uploaded to Storage.")

        # 6. Get Public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)
        
        # 7. Insert into 'documents' table
        row_data = {
            "filename": file.filename,
            "file_path": public_url,
            "upload_date": datetime.utcnow().isoformat(),
            "category": category,
            "title": title,
            "total_pages": total_pages,
            "file_size": file_size_kb
        }
        
        print("🔹 Inserting into 'documents' table...")
        try:
            data = supabase.table("documents").insert(row_data).execute()
        except Exception as insert_error:
            if "file_size" in str(insert_error) or "total_pages" in str(insert_error) or "PGRST204" in str(insert_error):
                print(f"⚠️ Metadata columns missing in Supabase. Falling back to basic insert. Error: {insert_error}")
                # Fallback: Remove metadata fields and try again
                basic_row_data = {
                    "filename": file.filename,
                    "file_path": public_url,
                    "upload_date": datetime.utcnow().isoformat(),
                    "category": category,
                    "title": title
                }
                data = supabase.table("documents").insert(basic_row_data).execute()
            else:
                raise insert_error
        
        document_id = None
        if hasattr(data, 'data') and len(data.data) > 0:
            document_id = data.data[0]['id']
            print(f"✅ Document inserted successfully. ID: {document_id}")
        else:
            print("❌ ERROR: Document ID not returned from Supabase.")

        # 8. Process PDF & Store Chunks
        if document_id and pages_content:
            print(f"🔹 Starting chunk processing for document_id: {document_id}")
            await process_pdf_and_store_chunks(document_id, pages_content)
        else:
            print("⚠️ Skipping chunking: Missing document_id or pages_content")

        # 9. Create Notification
        try:
            print("🔹 Creating notification...")
            notification_data = {
                "message": f"New circular uploaded: {title}",
                "type": "upload",
                "is_read": False,
                "created_at": datetime.utcnow().isoformat()
            }
            supabase.table("notifications").insert(notification_data).execute()
            print("✅ Notification created.")
        except Exception as notif_error:
            print(f"⚠️ Failed to create notification (non-critical): {notif_error}")
        
        print("🎉 Upload Process Complete.")

        if hasattr(data, 'data') and len(data.data) > 0:
            return {
                "message": "File uploaded successfully",
                "status": "success",
                "document": data.data[0]
            }
        else:
            return {
                "message": "File uploaded successfully",
                "status": "success",
                "data": row_data
            }

    except Exception as e:
        print(f"❌ Upload Critical Error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Upload failed: {str(e)}"
        )

async def process_pdf_and_store_chunks(document_id: int, pages_content: list):
    """
    Chunks the text page-by-page, generates embeddings, and stores them in Supabase 
    with core metadata (document_id, page_number, chunk_index).
    """
    try:
        supabase = get_supabase()
        
        print(f"🔹 Processing chunks for document {document_id} across {len(pages_content)} pages...")

        # Prepare all chunks with metadata first
        all_chunks_data = []
        global_chunk_idx = 0
        for page_data in pages_content:
            text = page_data["text"]
            page_num = page_data["page_number"]
            chunks = chunk_text(text)
            for chunk in chunks:
                all_chunks_data.append({
                    "text": chunk,
                    "page_number": page_num,
                    "chunk_index": global_chunk_idx
                })
                global_chunk_idx += 1

        # Process embeddings in parallel
        semaphore = asyncio.Semaphore(5) 
        
        async def process_single_chunk(chunk_item):
             async with semaphore:
                try:
                    # Run synchronous generate_embedding in a thread
                    embedding = await asyncio.to_thread(generate_embedding, chunk_item["text"])
                    return {
                        "document_id": document_id, 
                        "content": chunk_item["text"],
                        "embedding": embedding,
                        "page_number": chunk_item["page_number"],
                        "chunk_index": chunk_item["chunk_index"]
                    }
                except Exception as e:
                    print(f"❌ Embedding generation failed for chunk {chunk_item['chunk_index']}: {e}")
                    return None

        # Gather all embeddings
        tasks = [process_single_chunk(c) for c in all_chunks_data]
        results = await asyncio.gather(*tasks)
        
        # Filter out failed ones
        chunk_rows = [r for r in results if r is not None]
        
        if not chunk_rows:
            print("⚠️ No valid chunks generated.")
            return

        print(f"✅ Generated {len(chunk_rows)} embeddings. Inserting into DB...")
        
        # Insert in batches
        batch_size = 50
        for i in range(0, len(chunk_rows), batch_size):
            batch = chunk_rows[i:i + batch_size]
            try:
                supabase.table("document_chunks").insert(batch).execute()
                print(f"   ✅ Batch {i//batch_size + 1} ({len(batch)} chunks) inserted successfully.")
            except Exception as batch_error:
                print(f"❌ Batch insertion failed: {batch_error}")

        print("✅ All chunks inserted successfully.")

    except Exception as e:
        print(f"❌ process_pdf_and_store_chunks failed: {e}")

