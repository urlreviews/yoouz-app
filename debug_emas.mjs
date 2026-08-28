import * as cheerio from 'cheerio';

async function debug() {
  const url = 'https://www.emaslaw.com/';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log('=== Schema.org in Script tags ===');
    $('script[type="application/ld+json"]').each((i, el) => {
      console.log($(el).html());
    });

    console.log('=== Inline scripts scanning for potential images ===');
    const images = new Set();
    $('script').each((i, el) => {
      const content = $(el).html() || '';
      // Find matches for images
      const matches = content.match(/[\/a-zA-Z0-9_\-\.%]+\.(?:jpg|jpeg|png|webp|svg)/gi);
      if (matches) {
        matches.forEach(m => {
          if (!m.includes('.woff') && !m.includes('.js') && !m.includes('.css')) {
            images.add(m);
          }
        });
      }
    });

    for (const img of images) {
      console.log('Found script image candidate:', img);
    }
  } catch (e) {
    console.error(e);
  }
}

debug();
