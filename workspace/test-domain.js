async function testDomain(query) {
  const cleanQ = query.trim();
  console.log("-----------------------------------------");
  console.log("Testing query:", cleanQ);

  // Method 1: DuckDuckGo HTML
  try {
    const res = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(cleanQ), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,he;q=0.8,fr;q=0.8,nl;q=0.8",
        "Referer": "https://html.duckduckgo.com/"
      }
    });
    const html = await res.text();
    const links = [];
    const hrefRegex = /uddg=([^&"']+)/g;
    let m;
    while ((m = hrefRegex.exec(html)) !== null) {
      try {
        const urlStr = decodeURIComponent(m[1]);
        const u = new URL(urlStr);
        const host = u.hostname.toLowerCase().replace(/^www\./, "");
        if (!host.includes("duckduckgo") && !host.includes("facebook") && !host.includes("instagram") && !host.includes("wikipedia") && !host.includes("tripadvisor") && !host.includes("booking.com") && !host.includes("youtube") && !host.includes("linkedin") && !host.includes("twitter") && !host.includes("x.com")) {
          links.push(host);
        }
      } catch(e) {}
    }
    console.log("  DDG HTML links:", Array.from(new Set(links)).slice(0, 5));
  } catch(e) { console.error("DDG err:", e.message); }

  // Method 2: Google GBV=1
  try {
    const res = await fetch("https://www.google.com/search?q=" + encodeURIComponent(cleanQ + " official website") + "&gbv=1", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,he;q=0.8,fr;q=0.8,nl;q=0.8"
      }
    });
    const html = await res.text();
    const links = [];
    const hrefRegex = /href="\/url\?q=([^&"']+)/g;
    let m;
    while ((m = hrefRegex.exec(html)) !== null) {
      try {
        const urlStr = decodeURIComponent(m[1]);
        const u = new URL(urlStr);
        const host = u.hostname.toLowerCase().replace(/^www\./, "");
        if (!host.includes("google") && !host.includes("facebook") && !host.includes("instagram") && !host.includes("wikipedia") && !host.includes("tripadvisor") && !host.includes("booking.com") && !host.includes("youtube") && !host.includes("linkedin") && !host.includes("twitter") && !host.includes("x.com")) {
          links.push(host);
        }
      } catch(e) {}
    }
    console.log("  Google GBV=1 links:", Array.from(new Set(links)).slice(0, 5));
  } catch(e) { console.error("Google err:", e.message); }

  // Method 3: DuckDuckGo Autocomplete Suggest
  try {
    const res = await fetch("https://duckduckgo.com/ac/?q=" + encodeURIComponent(cleanQ) + "&type=list");
    const json = await res.json();
    console.log("  DDG Autocomplete:", json);
  } catch(e) { console.error("DDG AC err:", e.message); }
}

async function run() {
  for (const q of ["Yust Liege Hotel", "קלאב הוטל אילת", "David Chantraine Eupen", "Isrotel Eilat", "Dan Eilat"]) {
    await testDomain(q);
  }
}
run();
