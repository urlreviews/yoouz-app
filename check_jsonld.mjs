import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://www.fihclawgroup.com/';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  $('script[type="application/ld+json"]').each((i, el) => {
    const text = $(el).html() || '';
    console.log(`JSON-LD ${i}: size=${text.length}`);
    console.log(text.substring(0, 1000));
  });
}

test();
