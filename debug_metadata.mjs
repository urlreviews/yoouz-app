import * as cheerio from 'cheerio';

async function debug() {
  const url = 'https://www.isonharrison.co.uk/';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const getMetaContent = (key) => {
      return $(`meta[property="og:${key}"]`).attr('content') ||
             $(`meta[name="og:${key}"]`).attr('content') ||
             $(`meta[property="${key}"]`).attr('content') ||
             $(`meta[name="${key}"]`).attr('content') ||
             '';
    };
    
    console.log('Title:', getMetaContent('title') || $('title').text());
    console.log('Image:', getMetaContent('image'));
    console.log('Description:', getMetaContent('description'));
  } catch (e) {
    console.error(e);
  }
}

debug();
