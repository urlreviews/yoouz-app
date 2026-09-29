
async function testFirecrawlPort() {
  const url = "https://mc-rb4zzrxvx1.bunny.run:3002/v1/scrape";
  console.log("Testing Firecrawl with port at:", url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: "https://example.com" }),
      signal: AbortSignal.timeout(5000)
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text.substring(0, 200));
  } catch (e) {
    console.error("Fetch failed:", e.message);
  }
}
testFirecrawlPort();
