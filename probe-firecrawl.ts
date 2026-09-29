
async function probeFirecrawl() {
  const baseUrl = "https://mc-rb4zzrxvx1.bunny.run";
  const paths = ["/v1/scrape", "/scrape", "/v1/crawl", "/crawl", "/api/scrape", "/api/v1/scrape", "/"];
  
  console.log("Probing Firecrawl at:", baseUrl);
  
  for (const path of paths) {
    try {
      const url = baseUrl + path;
      const res = await fetch(url, {
        method: path === "/" ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        body: path === "/" ? undefined : JSON.stringify({ url: "https://example.com" }),
        signal: AbortSignal.timeout(5000)
      });
      console.log(`[${path}] Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        console.log(`[${path}] SUCCESS: ${text.substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`[${path}] Failed: ${e.message}`);
    }
  }
}

probeFirecrawl();
