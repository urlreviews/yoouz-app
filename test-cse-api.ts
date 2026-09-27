import fetch from 'node-fetch';

async function run() {
  const cx = 'e41632212e69a4efd';
  const query = 'oral dental studio nyc';
  const url = `https://cse.google.com/cse/element/v1?rsz=filtered_cse&num=5&hl=en&source=gcsc&gof=1&cx=${cx}&q=${encodeURIComponent(query)}`;
  
  console.log("Fetching:", url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const text = await res.text();
    console.log("Response text length:", text.length);
    console.log("Response starting 200 chars:", text.substring(0, 200));
    
    // Parse the JSON callback
    // Clean up comment or callback wrapping if there is any, e.g. /*gscb_c(...)*/
    let cleaned = text.trim();
    if (cleaned.startsWith('/*')) {
      // Find index of first '{' and last '}'
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
    }
    
    const parsed = JSON.parse(cleaned);
    console.log("Parsed keys:", Object.keys(parsed));
    if (parsed.results && parsed.results.length > 0) {
      console.log("First result:", JSON.stringify(parsed.results[0], null, 2));
    } else {
      console.log("No results in response:", parsed);
    }
  } catch(e) {
    console.error("Error:", e);
  }
}

run();
