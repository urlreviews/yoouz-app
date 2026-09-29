
async function testFirecrawl() {
  const url = "https://mc-rb4zzrxvx1.bunny.run/v1/scrape";
  console.log("Testing Firecrawl at:", url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: "https://example.com" })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text.substring(0, 200));
  } catch (e) {
    console.error("Fetch failed:", e.message);
  }
}
testFirecrawl();
