import os
import requests
import json
import base64
import io
from pypdf import PdfReader

from dotenv import load_dotenv

# Load environment variables (ensure they are loaded if not already)
load_dotenv()

def get_llm_response_stream(user_message: str, file_data: bytes = None, file_type: str = None):
    """
    Orchestrates requests between OpenAI (for Vision) and Groq (for Text).
    Streams the response chunk by chunk.
    """
    
    # 1. Vision Logic (Disabled/Removed OpenAI)
    if file_data and file_type and file_type.startswith("image/"):
        yield "Image analysis is currently unavailable as OpenAI has been removed."
        return

    # 2. Text/PDF Logic (Groq)
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        yield "Error: GROQ_API_KEY is missing."
        return

    url = "https://api.groq.com/openai/v1/chat/completions"
    model = "llama-3.1-8b-instant"
    messages = []
    
    # System Prompt
    system_content = """You are an expert RBI Compliance AI Assistant. 
Respond in a professional, structured, and easy-to-read format.
Rules:
- Use clear headings & bullet points.
- Add relevant markers.
- Keep spacing clean.
- If analyzing a document/image, be descriptive and accurate.
- Always end with a short compliance note."""

    messages.append({"role": "system", "content": system_content})

    # Handle PDF
    if file_data and file_type == "application/pdf":
        try:
            pdf_file = io.BytesIO(file_data)
            reader = PdfReader(pdf_file)
            pdf_text = ""
            for page in reader.pages:
                pdf_text += page.extract_text() + "\n"
            
            # Truncate if too long
            if len(pdf_text) > 20000:
                pdf_text = pdf_text[:20000] + "...(truncated)"

            messages.append({
                "role": "user",
                "content": f"{user_message}\n\n[Attached PDF Content]:\n{pdf_text}"
            })
        except Exception as e:
            yield f"Error processing PDF: {str(e)}"
            return
    else:
        # Standard Text Query
        messages.append({"role": "user", "content": user_message})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1024,
        "stream": True 
    }

    try:
        with requests.post(url, headers={"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"}, json=payload, stream=True, timeout=60) as response:
            if response.status_code != 200:
                yield f"Error: Groq API returned status {response.status_code}"
                return

            for line in response.iter_lines():
                if line:
                    line_text = line.decode('utf-8')
                    if line_text.startswith("data: "):
                        data_str = line_text[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data_json = json.loads(data_str)
                            content = data_json["choices"][0]["delta"].get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue

    except Exception as e:
        yield f"Error: An unexpected error occurred: {e}"
