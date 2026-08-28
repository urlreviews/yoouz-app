import * as cheerio from 'cheerio';

async function test_scrape() {
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
    const domain = 'emaslaw.com';
    const finalUrl = 'https://www.emaslaw.com';

    let title = $('title').first().text().trim() || '';
    if (!title) title = $('meta[property="og:title"]').attr('content') || '';

    let description = '';
    const getMetaContent = (nameOrProp) => {
      return $(`meta[name="${nameOrProp}"]`).attr('content') || 
             $(`meta[property="${nameOrProp}"]`).attr('content') || 
             $(`meta[property="og:${nameOrProp}"]`).attr('content') || '';
    };
    description = getMetaContent('description');

    let image = '';
    image = getMetaContent('image') || getMetaContent('og:image') || getMetaContent('twitter:image') || '';
    
    if (!image) {
      image = $('link[rel="image_src"]').attr('href') || '';
    }
    if (!image) {
      image = $('link[rel="preload"][as="image"]').first().attr('href') || '';
    }

    console.log('Initially scraped image before fallbacks:', image);

    if (!image) {
      const images = [];

      // Scan style attributes and custom lazy/data background attributes for high-res banner photos
      $('[data-bg], [data-bg-image], [style*="background-image"], [style*="background:"]').each((i, el) => {
        let bgUrl = $(el).attr('data-bg') || $(el).attr('data-bg-image') || '';
        if (!bgUrl) {
          const style = $(el).attr('style') || '';
          const bgMatch = style.match(/background(?:-image)?\s*:\s*url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/);
          if (bgMatch) bgUrl = bgMatch[1];
        }
        if (bgUrl && !bgUrl.includes('logo') && !bgUrl.includes('icon') && !bgUrl.startsWith('data:')) {
          images.push({src: bgUrl, area: 500000}); // give background images a high priority area!
        }
      });

      $('img').each((i, el) => {
        const src = $(el).attr('data-lazy-src') || $(el).attr('data-src') || $(el).attr('src');
        if (!src || src.startsWith('data:image/svg+xml') || src.includes('testimonials-star') || src.includes('star.png')) {
          return;
        }
        const width = parseInt($(el).attr('width') || '0', 10);
        const height = parseInt($(el).attr('height') || '0', 10);
        const lowerSrc = src.toLowerCase();
        
        // Avoid logos and small icons for body banner fallback
        if (!lowerSrc.includes('logo') && !lowerSrc.includes('icon') && !lowerSrc.includes('avatar') && !lowerSrc.includes('spinner') && (width > 200 || height > 200 || width === 0)) {
          images.push({src, area: (width || 201) * (height || 201)});
        }
      });

      if (images.length > 0) {
        image = images.sort((a, b) => b.area - a.area)[0].src;
      }
    }

    console.log('Scraped image after parsing img tags:', image);

    let logo = '';
    // Try finding logo in JSON-LD first, checking all schema types and also looking for image keys that contain 'logo'
    try {
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const obj = JSON.parse($(el).html() || '');
          const findLogo = (obj) => {
            if (!obj) return null;
            if (typeof obj === 'string') {
              if (obj.startsWith('http') && obj.toLowerCase().includes('logo')) return obj;
              return null;
            }
            if (typeof obj === 'object') {
              if (obj.logo) {
                if (typeof obj.logo === 'string') return obj.logo;
                if (typeof obj.logo === 'object' && obj.logo.url) return obj.logo.url;
                if (typeof obj.logo === 'object' && obj.logo.contentUrl) return obj.logo.contentUrl;
              }
              if (obj.image) {
                const imgUrl = typeof obj.image === 'string' ? obj.image : (obj.image.url || obj.image.contentUrl || '');
                if (typeof imgUrl === 'string' && imgUrl.toLowerCase().includes('logo')) {
                  return imgUrl;
                }
              }
              for (const key in obj) {
                if (key === '@context' || key === '@id') continue;
                const found = findLogo(obj[key]);
                if (found) return found;
              }
            }
            if (Array.isArray(obj)) {
              for (const item of obj) {
                const found = findLogo(item);
                if (found) return found;
              }
            }
            return null;
          };
          const found = findLogo(obj);
          if (found) {
            logo = found;
            return false; // break loop
          }
        } catch (e) {
          console.log('JSON-LD parse error in loop:', e.message);
        }
      });
    } catch (e) {
      console.log('JSON-LD main error:', e.message);
    }

    console.log('Scraped logo after JSON-LD parsing:', logo);

    if (!logo) {
      $('img').each((i, el) => {
        const src = $(el).attr('data-lazy-src') || $(el).attr('data-src') || $(el).attr('src') || '';
        const alt = $(el).attr('alt') || '';
        const id = $(el).attr('id') || '';
        const cls = $(el).attr('class') || '';
        if (src && (src.toLowerCase().includes('logo') || alt.toLowerCase().includes('logo') || id.toLowerCase().includes('logo') || cls.toLowerCase().includes('logo'))) {
          if (!src.startsWith('data:image/svg+xml') && !src.includes('testimonials-star') && !src.includes('star.png')) {
            logo = src;
            return false; // break loop
          }
        }
      });
    }

    console.log('Scraped logo after img tag scanning:', logo);

    if (!logo) {
      const appleTouch = $('link[rel="apple-touch-icon"]').attr('href') || 
                         $('link[rel="apple-touch-icon-precomposed"]').attr('href');
      if (appleTouch) {
        logo = appleTouch;
      }
    }

    console.log('Final logo:', logo);

  } catch (e) {
    console.error(e);
  }
}

test_scrape();
