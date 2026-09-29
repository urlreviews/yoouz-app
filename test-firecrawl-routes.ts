
async function testFirecrawl() {
  const baseUrl = "https://mc-rb4zzrxvx1.bunny.run";
  const routes = ["/v1/scrape", "/scrape", "/v1/crawl", "/crawl", "/"];
  for (const r of routes) {
    const url = baseUrl + r;
    console.log("Testing:", url);
    try {
      const res = await fetch(url, {
        method: r === "/" ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: r === "/" ? undefined : JSON.stringify({ url: "https://example.com" })
      });
      console.log(`[${r}] Status:`, res.status);
      const text = await res.text();
      console.log(`[${r}] Response:`, text.substring(0, 100));
    } catch (e) {
      console.error(`[${r}] Fetch failed:`, e.message);
    }
  }
}
testFirecrawl();
