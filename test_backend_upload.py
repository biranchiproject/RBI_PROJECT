import sys
import os

# Add server directory to path so imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
server_dir = os.path.join(current_dir, "..", "rbi-ai-assistant", "server")
sys.path.append(server_dir)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_upload_pdf():
    print("--- Starting Upload Test ---")
    
    # Create a dummy PDF file
    dummy_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/Name /F1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(RAG Test Document) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\n0000000223 00000 n\n0000000311 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n406\n%%EOF"
    
    files = {
        'file': ('test_document.pdf', dummy_pdf_content, 'application/pdf')
    }
    
    try:
        response = client.post("/api/upload", files=files)
        print(f"Response Status Code: {response.status_code}")
        print(f"Response JSON: {response.json()}")
    except Exception as e:
        print(f"Test Exception: {e}")

if __name__ == "__main__":
    test_upload_pdf()
