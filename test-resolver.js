async function resolveDomain(query) {
  try {
    const res = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query + " official website"), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,he;q=0.8,nl;q=0.8,fr;q=0.8",
        "Referer": "https://html.duckduckgo.com/"
      }
    });
    if (res.ok) {
      const html = await res.text();
      const re = /uddg=([^&"']+)/g;
      let m;
      while ((m = re.exec(html)) !== null) {
        try {
          const url = decodeURIComponent(m[1]);
          const u = new URL(url);
          const host = u.hostname.toLowerCase().replace(/^www\./, "");
          if (
            !host.includes("duckduckgo") &&
            !host.includes("facebook") &&
            !host.includes("instagram") &&
            !host.includes("wikipedia") &&
            !host.includes("tripadvisor") &&
            !host.includes("booking.com") &&
            !host.includes("youtube") &&
            !host.includes("linkedin") &&
            !host.includes("twitter") &&
            !host.includes("x.com")
          ) {
            return host;
          }
        } catch(e) {}
      }
    }
  } catch(e) {}
  return "";
}

async function run() {
  for (const q of ["ישרוטל אילת", "דן אילת", "David Chantraine Eupen", "Isrotel", "Dan Hotels"]) {
    const dom = await resolveDomain(q);
    console.log(q, "-> Found Domain:", dom);
  }
}
run();
