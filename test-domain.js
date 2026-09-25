async function probeCandidateDomains(query) {
  console.log("---------------------------------------");
  console.log("Probing for:", query);

  // 1. Try OSM Nominatim search with broad terms
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&extratags=1`, {
      headers: { "User-Agent": "YoouzApp/1.0 (info@yoouz.com)" }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      for (const item of data) {
        const site = item.extratags?.website || item.extratags?.["contact:website"] || item.extratags?.url;
        if (site) {
          const host = new URL(site).hostname.toLowerCase().replace(/^www\./, "");
          console.log("  FOUND VIA OSM:", host, "(", item.display_name, ")");
          return host;
        }
      }
    }
  } catch(e) {}

  // 2. Try candidate domain probing (Fast HEAD request)
  const cleanQ = query.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const words = cleanQ.split(/\s+/).filter(Boolean);
  const candidates = [];

  if (words.length >= 1) {
    const w0 = words[0];
    const w1 = words[1] || "";
    // Priority extensions: .com, .be, .co.il, .nl, .de, .fr, .hotel, .io
    const tlds = [".com", ".be", ".co.il", ".nl", ".fr", ".de"];
    
    for (const tld of tlds) {
      candidates.push(w0 + tld);
      if (w1) {
        candidates.push(w0 + w1 + tld);
        candidates.push(w0 + "-" + w1 + tld);
      }
    }
  }

  const uniqueCandidates = Array.from(new Set(candidates));
  console.log("  Testing candidates:", uniqueCandidates.slice(0, 8));

  for (const cand of uniqueCandidates) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch("https://" + cand, {
        method: "HEAD",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) YoouzBot/1.0" }
      });
      clearTimeout(timeout);
      if (res.ok || res.status < 400 || res.status === 403) {
        console.log("  SUCCESS CANDIDATE DOMAIN FOUND:", cand, "(status:", res.status, ")");
        return cand;
      }
    } catch(e) {}
  }

  return "";
}

async function run() {
  for (const q of ["Yust Liege Hotel", "David Chantraine Eupen", "קלאב הוטל אילת", "Isrotel Eilat", "Brugge Garage Jv"]) {
    const dom = await probeCandidateDomains(q);
    console.log("RESULT FOR", q, "=>", dom || "NONE");
  }
}
run();
