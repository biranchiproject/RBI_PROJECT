from datetime import datetime
import json

# Paste the function directly or import it if possible (but direct paste is safer for standalone test without dependency issues)
def table_to_json(table, page_num, table_idx, filename):
    if not table: return None
    
    # 1. Cleaning
    sanitized_table = []
    for row in table:
        if not any(cell for cell in row if cell and str(cell).strip()):
            continue
        sanitized_row = [str(cell).strip() if cell is not None else "" for cell in row]
        sanitized_table.append(sanitized_row)
        
    if len(sanitized_table) < 2: return None

    # 2. Smart Header Deduplication
    raw_headers = sanitized_table[0]
    headers = []
    header_counts = {}
    
    for i, h in enumerate(raw_headers):
        clean_h = h if h else "col"
        # Base case: if it's the first time we see this header
        if clean_h not in header_counts:
            header_counts[clean_h] = 1
            headers.append(clean_h)
        else:
            header_counts[clean_h] += 1
            headers.append(f"{clean_h}_{header_counts[clean_h]}") # e.g. Rate_2, Rate_3
    
    # 3. Row Construction
    rows = []
    for row in sanitized_table[1:]:
        row_dict = {}
        for i, header in enumerate(headers):
            val = row[i] if i < len(row) else ""
            row_dict[header] = val
        rows.append(row_dict)
        
    return {
        "table_id": f"Page{page_num}_T{table_idx + 1}",
        "metadata": {
            "row_count": len(rows),
            "col_count": len(headers),
        },
        "columns": headers,
        "rows": rows
    }

# Mock Data
mock_table = [
    ["Category", "Rate", "Rate", None, "   "], # Duplicate header "Rate", empty cols
    [None, None, None, None, None],          # Empty row to be removed
    ["Retail", "10%", "12%", "Ignored", ""], # Valid row
    ["", "", "", "", ""]                     # Empty row to be removed
]

print("🔹 Testing Table Extraction Logic...")
result = table_to_json(mock_table, 1, 0, "test.pdf")

if result:
    print(json.dumps(result, indent=2))
    
    # Assertions
    assert result["metadata"]["row_count"] == 1, "Failed: Should have 1 row"
    assert "Rate_2" in result["columns"], "Failed: Should handle duplicate headers"
    assert result["rows"][0]["Category"] == "Retail", "Failed: Data extraction error"
    print("\n✅ Test Passed: Logic is solid.")
else:
    print("❌ Test Failed: No result returned.")
