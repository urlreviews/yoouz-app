import json
import re

with open('test_data.json', 'r', encoding='utf-8', errors='ignore') as f:
    raw = f.read()

# Let's find all video chunks by searching for "id": "rev-
# Each video object has "id": "rev-..."
chunks = re.split(r'\{\s*\"id\"\s*:\s*\"rev-', raw)
print(f"Found {len(chunks)-1} review blocks")

recovered_videos = []
for i in range(1, len(chunks)):
    block = '{"id":"rev-' + chunks[i]
    # Find the end of this object before next block or end of list
    # Strip everything between "thumbnailUrl": and the next key
    # e.g. "likesCount" or "rating" or "createdAt" or "videoUrl"
    
    # Clean thumbnail in block
    block_clean = re.sub(r'\"thumbnailUrl\"\s*:\s*.*?(?=,\s*\"(?:videoUrl|rating|place|placeName|likes|userId|author|createdAt|comments|tags)\")', '\"thumbnailUrl\":\"\"', block, flags=re.DOTALL)
    
    # Keep only valid json chars
    block_clean = ''.join(c if ord(c) >= 32 or c in '\n\r\t' else ' ' for c in block_clean)
    
    # Try finding balanced braces from end
    end_idx = len(block_clean)
    parsed = None
    while end_idx > 0:
        candidate = block_clean[:end_idx].strip()
        if candidate.endswith(','):
            candidate = candidate[:-1].strip()
        if candidate.endswith(']'):
            candidate = candidate[:-1].strip()
        if candidate.endswith('}'):
            try:
                parsed = json.loads(candidate)
                break
            except:
                pass
        end_idx = block_clean.rfind('}', 0, end_idx - 1)
        if end_idx != -1:
            end_idx += 1
        else:
            break
    
    if parsed:
        recovered_videos.append(parsed)
        pname = parsed.get('placeName') or (parsed.get('place') or {}).get('name') or parsed.get('placeId')
        print(f"✅ Recovered #{len(recovered_videos)}: [{parsed.get('id')}] {pname} by {(parsed.get('author') or {}).get('name')}")
    else:
        print(f"❌ Failed to parse chunk #{i}")

print(f"\n🎉 Total successfully recovered videos: {len(recovered_videos)}")
with open('uploads/reviews_index.json', 'w', encoding='utf-8') as out:
    json.dump(recovered_videos, out, indent=2)
print("✅ Saved to uploads/reviews_index.json")
