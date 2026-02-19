import re

class SlabMatcher:
    @staticmethod
    def extract_query_numbers(query: str):
        """
        Extracts monetary values and numbers from query.
        Converts '10 Lakhs', '5 Cr' to raw numbers.
        Returns a list of floats.
        """
        query_lower = query.lower().replace(",", "")
        numbers = []
        
        # 1. Pattern for explicit units (e.g. 10 lakhs, 5 cr)
        unit_pattern = r"(\d+(?:\.\d+)?)\s*(lakhs?|lac|cr|crores?)"
        matches = re.findall(unit_pattern, query_lower)
        
        for val, unit in matches:
            val = float(val)
            if "lakh" in unit or "lac" in unit:
                numbers.append(val * 100000)
            elif "crore" in unit or "cr" in unit:
                numbers.append(val * 10000000)
                
        # 2. Pattern for plain large numbers (e.g. 500000)
        # Avoid small numbers like "page 1", "section 2"
        plain_pattern = r"\b(\d{4,})\b" 
        plain_matches = re.findall(plain_pattern, query_lower)
        for val in plain_matches:
            numbers.append(float(val))
            
        return list(set(numbers))

    @staticmethod
    def extract_query_labels(query: str):
        """
        Extracts conceptual labels/row names from query.
        """
        labels = [
            "financial data", "pan", "proof of address", "fpi", 
            "mandatory", "exempted", "category", "document type",
            "statutory", "limit", "threshold", "compliance",
            "audit", "reporting", "disclosure", "capital",
            "risk", "liquidity", "exposure", "governance",
            "loan limit", "maximum cost", "dwelling unit", "population",
            "metropolitan", "urban", "semi-urban", "rural", "centres"
        ]
        query_lower = query.lower()
        found = [l for l in labels if l in query_lower]
        return found

    @staticmethod
    def find_matching_rows(tables: list, query_numbers: list = None, query_labels: list = None):
        """
        Iterates through structured tables and finds rows where numeric columns match 
        query numbers OR row labels match query labels.
        """
        if not query_numbers and not query_labels:
            return []
            
        relevant_rows = []
        matched_label = None
        
        for table in tables:
            rows = table.get("table_data", {}).get("rows", [])
            headers = table.get("table_data", {}).get("columns", [])
            
            for row in rows:
                row_str = str(row).lower()
                is_match = False
                
                # 1. Label Match (High Priority - Strict deterministic requirement)
                if query_labels:
                    for label in query_labels:
                        if label.lower() in row_str:
                            is_match = True
                            matched_label = label
                            break
                
                # 2. Number Match (If labels didn't match or aren't present)
                if not is_match and query_numbers:
                    for q_num in query_numbers:
                        # Plain string match
                        if str(int(q_num)) in row_str:
                            is_match = True
                            break
                        # "Lakh" conversion match
                        if q_num >= 100000:
                            lakh_val = q_num / 100000
                            if f"{int(lakh_val)} lakh" in row_str or f"{lakh_val} lakh" in row_str:
                                is_match = True
                                break
                            
                if is_match:
                    relevant_rows.append({
                        "table_id": table.get("table_index"),
                        "row_content": row,
                        "headers": headers
                    })
        
        if matched_label:
            print(f"[TEST MODE] Matched Label: {matched_label}")
        return relevant_rows

    @staticmethod
    def verify_column_integrity(matching_rows: list, answer_text: str) -> bool:
        """
        🏆 Requirement 3: Ensure output contains same number of categories.
        Counts columns in raw data vs categories in AI response.
        """
        if not matching_rows: return True
        
        # Get count of columns from the first matching row (assuming consistency)
        headers = matching_rows[0].get("headers", [])
        expected_count = len([h for h in headers if h.strip()])
        
        # Count categories in answer (looking for common patterns like "**Category**" or "Category I:")
        # We also look for bullet points or bold labels that usually indicate a column value
        # A more robust check is to see if values from the row are present
        missing = SlabMatcher.get_missing_values(matching_rows, answer_text)
        
        return len(missing) == 0

    @staticmethod
    def get_missing_values(matching_rows: list, answer_text: str) -> list:
        """Helper to find values from raw row missing in the answer."""
        missing = []
        ans_lower = answer_text.lower()
        
        for row_obj in matching_rows:
            row_cells = row_obj.get("row_content", [])
            if isinstance(row_cells, list):
                for cell in row_cells:
                    cell_str = str(cell).strip()
                    # Skip noise and empty cells
                    if not cell_str or len(cell_str) < 2 or cell_str.lower() in ["na", "-", "nil", "none"]: 
                        continue
                    if cell_str.lower() not in ans_lower:
                        missing.append(cell_str)
        return list(set(missing))

    @staticmethod
    def append_missing_columns(matching_rows: list, answer_text: str) -> str:
        """
        🏆 Requirement 3: Append missing columns programmatically if LLM fails.
        """
        missing_vals = SlabMatcher.get_missing_values(matching_rows, answer_text)
        if not missing_vals:
            return answer_text
            
        recovery_text = "\n\n**🛡️ Data Recovery: Missing Column Values**\n"
        for val in missing_vals:
            recovery_text += f"- **Missing Info**: {val}\n"
        
        print(f"DEBUG: Programmatic Recovery added {len(missing_vals)} values.")
        return answer_text + recovery_text
    @staticmethod
    def has_valid_headers(matching_rows: list) -> bool:
        """
        Requirement 5 & 8: Detect if headers are generic 'Column_X' and thus mapping failed.
        """
        if not matching_rows: return True
        headers = matching_rows[0].get("headers", [])
        if not headers: return False
        
        # Check if ALL headers start with 'Column_' or are empty
        generic_count = sum(1 for h in headers if h.startswith("Column_") or not h.strip())
        return generic_count < len(headers)

    @staticmethod
    def parse_inline_table(text: str):
        """
        Requirement 5 & 6: Handle inline tables (no proper grid) using regex.
        Specifically for population-based limits.
        """
        inline_pattern = r"(Centres with population.*?)\b(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\b"
        match = re.search(inline_pattern, text, re.IGNORECASE | re.DOTALL)
        
        if match:
            header_text = match.group(1).strip()
            val1 = match.group(2)
            val2 = match.group(3)
            
            # Map manually based on Requirement 6
            return {
                "headers": ["Population Category", "Loan Limit (₹ lakh)", "Maximum Cost of Dwelling (₹ lakh)"],
                "rows": [{
                    "Population Category": header_text,
                    "Loan Limit (₹ lakh)": val1,
                    "Maximum Cost of Dwelling (₹ lakh)": val2
                }]
            }
        return None

    @staticmethod
    def parse_raw_text_table(text: str):
        """
        Requirement 1, 2, 3: Robustly detect and parse tables from raw text chunks.
        """
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        header_patterns = ["category", "loan limit", "maximum cost", "(amount in ₹ lakh)"]
        
        header_row_idx = -1
        headers = []
        
        # 1. Detect header row
        for i, line in enumerate(lines):
            line_lower = line.lower()
            if any(p in line_lower for p in header_patterns):
                header_row_idx = i
                # Split by 2+ spaces or tabs
                headers = [h.strip() for h in re.split(r'\s{2,}|\t', line) if h.strip()]
                break
        
        if header_row_idx == -1 or not headers:
            return None
            
        # 2. Extract subsequent rows
        rows = []
        for line in lines[header_row_idx + 1:]:
            # Use same splitting logic
            vals = [v.strip() for v in re.split(r'\s{2,}|\t', line) if v.strip()]
            
            if len(vals) >= len(headers):
                row_dict = {}
                for i, h in enumerate(headers):
                    if i < len(vals):
                        row_dict[h] = vals[i]
                rows.append(row_dict)
            elif len(vals) > 0:
                # Attempt heuristic alignment if fewer values
                row_dict = {headers[0]: vals[0]}
                if len(vals) > 1:
                    row_dict[headers[-1]] = vals[-1]
                rows.append(row_dict)
                
        if not rows:
            return None
            
        return {
            "headers": headers,
            "rows": rows
        }
