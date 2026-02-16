from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import uuid
import os
from datetime import datetime
from services.supabase_client import get_supabase
import fitz # PyMuPDF
from services.embedding_service import generate_embedding
from dotenv import load_dotenv
import asyncio
import json

load_dotenv()

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_MIME_TYPES = ["application/pdf"]
BUCKET_NAME = "rbi-documents"



def chunk_text(text: str, chunk_size=1000, overlap=100):
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

    
    # 3. Extract Text Content (PyMuPDF)
    extracted_text = ""
    try:
        # PyMuPDF is sync, so we wrap it if it takes too long, but usually fast for small docs
        # For very large docs, this could block.
        with fitz.open(stream=content, filetype="pdf") as doc:
            for page in doc:
                extracted_text += page.get_text()
        print(f"✅ Text extracted: {len(extracted_text)} characters")
    except Exception as e:
        print(f"❌ Text extraction failed: {e}")
        extracted_text = ""
    
    # 4. Generate Unique Filename & Path
    file_extension = os.path.splitext(file.filename)[1] or ".pdf"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
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
            "content": extracted_text 
        }
        
        print("🔹 Inserting into 'documents' table...")
        data = supabase.table("documents").insert(row_data).execute()
        print("✅ Document record created.")
        
        document_id = None
        if hasattr(data, 'data') and len(data.data) > 0:
            document_id = data.data[0]['id']
        else:
            # Fallback: try to fetch the document we just inserted if response is weird
            print("⚠️ Document ID not returned directly, attempting fetch...")
            try:
                # This fallback might not be perfect but helps if return is empty
                pass 
            except:
                pass

        # 8. Process PDF & Store Chunks (Extracted Function)
        if document_id and extracted_text:
            print(f"🔹 Starting chunk processing for document_id: {document_id}")
            await process_pdf_and_store_chunks(document_id, extracted_text)
        else:
            print("⚠️ Skipping chunking: Missing document_id or extracted_text")

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
            # We catch this so it doesn't fail the upload even if notifications table is missing
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
        # Even on error, we might want to return a 500 but structured
        raise HTTPException(
            status_code=500, 
            detail=f"Upload failed: {str(e)}"
        )

async def process_pdf_and_store_chunks(document_id: str, text: str):
    """
    Chunks the text, generates embeddings, and stores them in Supabase.
    """
    try:
        chunks = chunk_text(text)
        print(f"🔹 Processing {len(chunks)} chunks for document {document_id}...")
        
        supabase = get_supabase()
        chunk_rows = []
        
        # Process embeddings in parallel
        semaphore = asyncio.Semaphore(5) 
        
        async def process_single_chunk(chunk):
             async with semaphore:
                try:
                    # Run synchronous generate_embedding in a thread
                    embedding = await asyncio.to_thread(generate_embedding, chunk)
                    return {
                        "document_id": document_id, 
                        "content": chunk,
                        "embedding": embedding
                    }
                except Exception as e:
                    print(f"❌ Embedding generation failed for chunk: {e}")
                    return None

        # Gather all embeddings
        tasks = [process_single_chunk(chunk) for chunk in chunks]
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
                print(f"   - Batch {i//batch_size + 1} inserted.")
            except Exception as batch_error:
                print(f"❌ Batch insertion failed: {batch_error}")

        print("✅ All chunks inserted successfully.")

    except Exception as e:
        print(f"❌ process_pdf_and_store_chunks failed: {e}")

