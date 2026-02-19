import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os
import asyncio
import fitz # PyMuPDF
from services.supabase_client import get_supabase
from services.ingestion_service import ingest_rbi_document
from groq import Groq

class RBIScraperService:
    def __init__(self):
        self.base_url = "https://www.rbi.org.in"
        self.notifications_url = "https://www.rbi.org.in/Scripts/Notifications.aspx"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        api_key = os.getenv("GROQ_API_KEY")
        self.groq_client = Groq(api_key=api_key) if api_key else None

    async def get_latest_updates(self, limit=5):
        """Scrapes RBI 'What's New' page with improved selectors."""
        try:
            url = f"{self.base_url}/Scripts/BS_ViewWasNewResponse.aspx"
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            updates = []
            # Aggregate all content links
            links = soup.find_all("a", href=True)
            
            for a in links:
                href = a['href']
                text = a.get_text(strip=True)
                
                # Extremely broad filters for regulatory documents
                if any(x.lower() in href.lower() for x in ["display.aspx", "notification", "circular", "pressrelease", "master"]) and len(text) > 10:
                    full_link = href if href.startswith("http") else self.base_url + (href if href.startswith("/") else "/" + href)
                    
                    # Try to capture date from parent context
                    date_str = ""
                    context_area = a.find_parent("td") or a.find_parent("div")
                    if context_area:
                        date_match = re.search(r'([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})', context_area.get_text())
                        if date_match:
                            date_str = date_match.group(1)
                    
                    if not any(u['url'] == full_link for u in updates):
                        updates.append({
                            "title": text,
                            "url": full_link,
                            "date": date_str,
                            "pdf_url": full_link
                        })
                
                if len(updates) >= limit: break
            
            # Fallback if no specific links found: look for common table rows
            if not updates:
                rows = soup.find_all("tr")
                for row in rows:
                    a = row.find("a", href=True)
                    if a and len(a.text.strip()) > 20:
                        href = a['href']
                        full_link = href if href.startswith("http") else self.base_url + (href if href.startswith("/") else "/" + href)
                        updates.append({
                            "title": a.text.strip(),
                            "url": full_link,
                            "date": row.find_all("td")[0].text.strip() if row.find_all("td") else "",
                            "pdf_url": full_link
                        })
                    if len(updates) >= limit: break

            return updates
        except Exception as e:
            print(f"ERROR: Scraper failed: {e}")
            return []

    async def generate_summary(self, text):
        """Uses Groq to generate a 2-sentence summary of the update."""
        if not self.groq_client: return "No summary available."
        
        prompt = f"Summarize this RBI notification in exactly 2 concise sentences for a compliance officer:\n\n{text[:3000]}"
        try:
            res = self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                temperature=0.3,
                max_tokens=150
            )
            return res.choices[0].message.content.strip()
        except:
            return "Summary generation failed."

    async def sync_updates(self):
        """Main loop to sync latest RBI updates into the database."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] INFO: Synchronizing RBI Updates...")
        
        try:
            updates = await self.get_latest_updates(limit=3)
            supabase = get_supabase()
            
            for up in updates:
                # Check if already exists (by URL or PDF URL)
                existing = supabase.table("rbi_updates").select("id").eq("pdf_url", up['pdf_url']).execute()
                if existing.data:
                    print(f"INFO: Duplicate skipped: {up['title']}")
                    continue
                
                print(f"INFO: New Update Found: {up['title']}")
                
                # 1. Fetch content for summary
                content_text = up['title'] # Fallback
                pdf_bytes = None
                try:
                    # If it's a PDF or page, try to get some text
                    resp = requests.get(up['url'], headers=self.headers, timeout=10)
                    if up['url'].endswith(".pdf") or "application/pdf" in resp.headers.get("Content-Type", ""):
                        pdf_bytes = resp.content
                        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                            content_text = doc[0].get_text()[:3000]
                    else:
                        s = BeautifulSoup(resp.text, "html.parser")
                        content_text = s.get_text()[:3000]
                except Exception as inner_e:
                    print(f"WARNING: Resource fetch failed for {up['title']}: {inner_e}")

                summary = await self.generate_summary(content_text)
                
                # 2. Ingest if PDF exists
                doc_id = None
                if pdf_bytes:
                    doc_id = await ingest_rbi_document(pdf_bytes, f"rbi_update_{datetime.now().strftime('%Y%m%d')}.pdf", up['title'])
                
                # 3. Store in rbi_updates
                update_row = {
                    "title": up['title'],
                    "url": up['url'],
                    "pdf_url": up['pdf_url'],
                    "publish_date": datetime.now().strftime("%Y-%m-%d"), # Approximation if parsing fails
                    "summary": summary,
                    "document_id": doc_id
                }
                supabase.table("rbi_updates").insert(update_row).execute()
                print(f"SUCCESS: Ingested update: {up['title']}")

            return len(updates)
            
        except Exception as e:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{timestamp}] ERROR: Sync failed: {e}")
            return 0
