import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://www.fihclawgroup.com/';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    $('script').each((i, el) => {
      const src = $(el).attr('src');
      const text = $(el).html() || '';
      console.log(`Script ${i}: src="${src || 'inline'}" size=${text.length}`);
      if (text.includes('wixstatic.com/media/')) {
        console.log(`-> Contains wixstatic.com/media/ ! First 300 chars:`, text.substring(text.indexOf('wixstatic.com/media/') - 50, text.indexOf('wixstatic.com/media/') + 150));
      }
    });
  } catch (e) {
    console.error(e);
  }
}

test();
