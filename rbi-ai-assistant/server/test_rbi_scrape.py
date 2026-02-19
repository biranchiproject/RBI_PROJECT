import requests
from bs4 import BeautifulSoup
import json

def test_scrape_rbi():
    url = "https://www.rbi.org.in/Scripts/BS_ViewWasNewResponse.aspx"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Look for the table with class 'table-responsive' or similar or just all <a> tags with specific patterns
        results = []
        # On RBI site, updates are often in a table with specific IDs
        # Let's try to find all <a> tags that look like notifications
        for a in soup.find_all("a", href=True):
            if "NotificationDisplay.aspx" in a['href'] or "PressReleaseDisplay.aspx" in a['href'] or "CircularDisplay.aspx" in a['href']:
                title = a.get_text(strip=True)
                link = "https://www.rbi.org.in" + a['href'] if a['href'].startswith("/") else a['href']
                
                # Try to find date (usually in the same row or nearby text)
                parent_td = a.find_parent("td")
                date_str = ""
                if parent_td:
                    # Date is often in a preceding <td> or in the same row
                    row = parent_td.find_parent("tr")
                    if row:
                        tds = row.find_all("td")
                        if len(tds) > 0:
                            date_str = tds[0].get_text(strip=True)
                
                results.append({
                    "title": title,
                    "url": link,
                    "date": date_str
                })
        
        print(f"Found {len(results)} potential updates.")
        for r in results[:5]:
            print(f"- {r['date']}: {r['title']} ({r['url']})")
            
    except Exception as e:
        print(f"Scrape failed: {e}")

if __name__ == "__main__":
    test_scrape_rbi()
