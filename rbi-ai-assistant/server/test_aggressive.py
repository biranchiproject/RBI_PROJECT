import requests
from bs4 import BeautifulSoup
import re

def test_aggresive_scrape():
    url = "https://www.rbi.org.in/Scripts/BS_ViewWasNewResponse.aspx"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    base_url = "https://www.rbi.org.in"
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        updates = []
        all_links = soup.find_all("a", href=True)
        print(f"Total links found: {len(all_links)}")
        
        for a in all_links:
            href = a['href']
            text = a.get_text(strip=True)
            
            # Look for regulatory content
            if any(x in href for x in ["NotificationDisplay", "CircularDisplay", "PressReleaseDisplay"]) and len(text) > 20:
                link = href if href.startswith("http") else base_url + (href if href.startswith("/") else "/" + href)
                
                date_str = ""
                # Search for date in proximity
                context = a.find_parent().get_text() if a.find_parent() else ""
                date_match = re.search(r'([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})', context)
                if date_match:
                    date_str = date_match.group(1)
                
                if not any(u['url'] == link for u in updates):
                    updates.append({
                        "title": text,
                        "url": link,
                        "date": date_str
                    })
            if len(updates) >= 5: break
            
        print(f"Found {len(updates)} updates.")
        for u in updates:
            print(f"- {u['date']}: {u['title']}")
            
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_aggresive_scrape()
