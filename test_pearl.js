import * as cheerio from 'cheerio';

async function searchDuckDuckGoWeb(query) {
  const cleanQ = query.trim();
  if (!cleanQ) return null;

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 3500);

    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQ)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      signal: ctrl.signal
    });
    clearTimeout(tid);

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const candidates = [];

      $('.result').each((_, el) => {
        const linkEl = $(el).find('a.result__a').first();
        let rawHref = linkEl.attr('href') || '';
        let rawTitle = linkEl.text().trim();
        let snippet = $(el).find('.result__snippet').text().trim();

        if (rawHref) {
          if (rawHref.includes('uddg=')) {
            try {
              const match = rawHref.match(/uddg=([^&]+)/);
              if (match) rawHref = decodeURIComponent(match[1]);
            } catch(e) {}
          } else if (rawHref.startsWith('//')) {
            rawHref = 'https:' + rawHref;
          }

          console.log("Candidate:", rawTitle, "->", rawHref);
        }
      });
    }
  } catch(e) {
    console.error(e);
  }
}

searchDuckDuckGoWeb("pearl dental nyc");
