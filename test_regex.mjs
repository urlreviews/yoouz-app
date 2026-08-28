import * as cheerio from 'cheerio';

async function test_regex(url) {
  console.log(`\n=== Testing Robust Regex on: ${url} ===`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const scriptLogos = new Set();
    const scriptImages = new Set();

    // Helper to cleanse and upgrade CDN image URLs
    const getHighQualityImageUrl = (urlStr) => {
      if (!urlStr) return '';
      let cleaned = urlStr;
      if (cleaned.includes('wixstatic.com/media/')) {
        const wixMatch = cleaned.match(/^(https?:\/\/static\.wixstatic\.com\/media\/[^/]+)/);
        if (wixMatch) cleaned = wixMatch[1];
      }
      if (cleaned.includes('i0.wp.com/') || cleaned.includes('i1.wp.com/') || cleaned.includes('i2.wp.com/') || cleaned.includes('i3.wp.com/')) {
        cleaned = cleaned.split('?')[0];
      }
      const wpThumbRegex = /(-\d+x\d+)(\.[a-zA-Z0-9]+)$/;
      if (wpThumbRegex.test(cleaned)) {
        cleaned = cleaned.replace(wpThumbRegex, '$2');
      }
      if (cleaned.includes('/cdn.shopify.com/')) {
        const shopifyRegex = /_({?)(?:pico|icon|thumb|small|compact|medium|large|grande|1024x1024|2048x2048|\d+x\d+)(}?)(?=\.[a-zA-Z0-9]+$|\?)/;
        cleaned = cleaned.replace(shopifyRegex, '');
      }
      if (cleaned.includes('squarespace.com') || cleaned.includes('images.squarespace-cdn.com')) {
        if (cleaned.includes('?format=')) {
          cleaned = cleaned.replace(/\?format=\d+w/, '?format=1500w').replace(/&format=\d+w/, '&format=1500w');
        }
      }
      return cleaned;
    };

    $('script').each((i, el) => {
      const text = $(el).html() || '';
      if (text.length > 300000) {
        // Skip excessively large minified script blocks to maintain performance
        return;
      }
      
      const fullUrlRegex = /(?:https?:)?\/\/[^\s"'()<>`#]+?\.(?:jpg|jpeg|png|webp|svg)(?:[\/\?#][^\s"'()<>`#]*)?/gi;
      const relativePathRegex = /\/(?:wp-content|images|uploads|_next|static|assets|media|content)\/[^\s"'()<>`#]+?\.(?:jpg|jpeg|png|webp|svg)(?:[\/\?#][^\s"'()<>`#]*)?/gi;

      const fullMatches = text.match(fullUrlRegex) || [];
      const relativeMatches = text.match(relativePathRegex) || [];

      [...fullMatches, ...relativeMatches].forEach(match => {
        const lower = match.toLowerCase();
        let cleaned = match;
        try {
          cleaned = decodeURIComponent(match);
        } catch (e) {}

        cleaned = getHighQualityImageUrl(cleaned);

        if (lower.includes('logo')) {
          scriptLogos.add(cleaned);
        } else if (
          !lower.includes('icon') && 
          !lower.includes('avatar') && 
          !lower.includes('star') && 
          !lower.includes('spinner') &&
          !lower.includes('arrow') &&
          !lower.includes('bullet') &&
          !lower.includes('check') &&
          !lower.includes('marker')
        ) {
          scriptImages.add(cleaned);
        }
      });
    });

    console.log('Script Logos found:', Array.from(scriptLogos));
    console.log('Script Images found:', Array.from(scriptImages));

  } catch (e) {
    console.error(e);
  }
}

async function run() {
  await test_regex('https://www.emaslaw.com/');
  await test_regex('https://www.fihclawgroup.com/');
}

run();
