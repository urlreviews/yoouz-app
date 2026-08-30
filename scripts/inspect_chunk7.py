import json
import re

with open('test_data.json', 'r', encoding='utf-8', errors='ignore') as f:
    raw = f.read()

chunks = re.split(r'\{\s*\"id\"\s*:\s*\"rev-', raw)
if len(chunks) > 7:
    c7 = chunks[7]
    print("Chunk 7 length:", len(c7))
    print("Chunk 7 sample:", c7[:300])
    
    # Extract properties using regex
    prop_matches = re.findall(r'\"([a-zA-Z0-9_]+)\"\s*:\s*(\"[^\"]*\"|\d+|true|false|null|\[.*?\]|\{.*?\})', c7)
    print(f"Extracted {len(prop_matches)} properties from chunk 7")
    
    # Let's clean and parse chunk 7
    cleaned_c7 = re.sub(r'\"thumbnailUrl\"\s*:\s*.*?(?=,\s*\"[a-zA-Z0-9_]+\"\s*:)', '\"thumbnailUrl\":\"\"', '{"id":"rev-' + c7, flags=re.DOTALL)
    cleaned_c7 = ''.join(c if ord(c) >= 32 or c in '\n\r\t' else ' ' for c in cleaned_c7)
    
    # Try parsing
    end_idx = len(cleaned_c7)
    while end_idx > 0:
        cand = cleaned_c7[:end_idx].strip()
        if cand.endswith(','): cand = cand[:-1].strip()
        if cand.endswith(']'): cand = cand[:-1].strip()
        if cand.endswith('}'):
            try:
                obj = json.loads(cand)
                print("Successfully parsed chunk 7:", obj.get('placeName'), obj.get('videoUrl'))
                break
            except Exception as e:
                pass
        end_idx = cleaned_c7.rfind('}', 0, end_idx - 1)
        if end_idx != -1:
            end_idx += 1
        else:
            break
