import * as cheerio from 'cheerio';

async function test_enhanced(url) {
  console.log(`\n=== Testing Enhanced Scraper on: ${url} ===`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const getMetaContent = (nameOrProp) => {
      return $(`meta[name="${nameOrProp}"]`).attr('content') || 
             $(`meta[property="${nameOrProp}"]`).attr('content') || 
             $(`meta[property="og:${nameOrProp}"]`).attr('content') || '';
    };

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

    // 1. COLLECT ALL SCRIPT CANDIDATES (For SPA, Next.js, Hydration data, and JSON-LD)
    const scriptImages = [];
    const scriptLogos = [];
    
    // Parse JSON-LD schemas
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const text = $(el).html() || '';
        const obj = JSON.parse(text);
        
        const traverseSchema = (item) => {
          if (!item) return;
          if (typeof item === 'string') {
            const lower = item.toLowerCase();
            if (lower.startsWith('http') && (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.svg'))) {
              if (lower.includes('logo')) {
                scriptLogos.push(item);
              } else if (!lower.includes('icon') && !lower.includes('avatar') && !lower.includes('star')) {
                scriptImages.push(item);
              }
            }
          } else if (typeof item === 'object') {
            if (item.logo) {
              if (typeof item.logo === 'string') scriptLogos.push(item.logo);
              else if (typeof item.logo === 'object' && item.logo.url) scriptLogos.push(item.logo.url);
            }
            if (item.image) {
              if (typeof item.image === 'string') scriptImages.push(item.image);
              else if (typeof item.image === 'object' && item.image.url) scriptImages.push(item.image.url);
            }
            for (const key in item) {
              traverseSchema(item[key]);
            }
          } else if (Array.isArray(item)) {
            item.forEach(traverseSchema);
          }
        };
        traverseSchema(obj);
      } catch (e) {}
    });

    // Scan all script blocks for image/logo patterns
    $('script').each((i, el) => {
      const text = $(el).html() || '';
      if (text.includes('__next_f') || text.includes('__NEXT_DATA__') || text.includes('window.__') || text.includes('bootstrap')) {
        // Find path-like strings with image extensions
        const matches = text.match(/["']([^"']+\.(?:jpg|jpeg|png|webp|svg)(?:\?[^"']*)?)["']/gi);
        if (matches) {
          matches.forEach(m => {
            const cleanedPath = m.replace(/["']/g, '').trim();
            if (!cleanedPath || cleanedPath.startsWith('data:')) return;
            const lower = cleanedPath.toLowerCase();
            
            if (lower.includes('logo')) {
              scriptLogos.push(cleanedPath);
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
              scriptImages.push(cleanedPath);
            }
          });
        }
      }
    });

    console.log('Script Logos found:', scriptLogos);
    console.log('Script Images found:', scriptImages);

    // 2. EXTRACT LOGO
    let logo = '';
    // Priority 1: From script/JSON-LD direct logos
    if (scriptLogos.length > 0) {
      logo = scriptLogos[0];
    }

    // Priority 2: From explicit HTML image tags containing 'logo'
    if (!logo) {
      $('img').each((i, el) => {
        const src = $(el).attr('data-lazy-src') || $(el).attr('data-src') || $(el).attr('src') || '';
        const alt = $(el).attr('alt') || '';
        const id = $(el).attr('id') || '';
        const cls = $(el).attr('class') || '';
        if (src && (src.toLowerCase().includes('logo') || alt.toLowerCase().includes('logo') || id.toLowerCase().includes('logo') || cls.toLowerCase().includes('logo'))) {
          if (!src.startsWith('data:image/svg+xml') && !src.includes('testimonials-star') && !src.includes('star.png')) {
            logo = src;
            return false;
          }
        }
      });
    }

    // Priority 3: Apple touch icons
    if (!logo) {
      logo = $('link[rel="apple-touch-icon"]').attr('href') || 
             $('link[rel="apple-touch-icon-precomposed"]').attr('href') || '';
    }

    // Priority 4: Standard high-res icons
    if (!logo) {
      logo = $('link[rel="icon"]').first().attr('href') || '';
    }

    // 3. EXTRACT BANNER IMAGE
    let image = '';
    
    // Check main metadata og:image / twitter:image
    const rawMetaImage = getMetaContent('image') || getMetaContent('og:image') || getMetaContent('twitter:image') || '';
    
    // We only accept the raw og:image if it's not a logo, small icon, or svg
    if (rawMetaImage && !rawMetaImage.toLowerCase().includes('logo') && !rawMetaImage.toLowerCase().includes('icon') && !rawMetaImage.toLowerCase().endsWith('.svg')) {
      image = rawMetaImage;
    }

    // If meta image was empty or invalid (e.g. was an SVG or Logo), look for better images
    if (!image) {
      const candidates = [];

      // Add script/JSON-LD discovered images (highly trustworthy for SPAs!)
      scriptImages.forEach(src => {
        let weight = 100;
        const lower = src.toLowerCase();
        if (lower.includes('attorney') || lower.includes('team') || lower.includes('group') || lower.includes('headshot')) weight += 500;
        if (lower.includes('office') || lower.includes('banner') || lower.includes('hero') || lower.includes('bg') || lower.includes('background')) weight += 300;
        if (lower.endsWith('.svg')) weight -= 200; // SVGs are bad for banners
        candidates.push({ src, weight });
      });

      // Scan inline/background styles
      $('[data-bg], [data-bg-image], [style*="background-image"], [style*="background:"]').each((i, el) => {
        let bgUrl = $(el).attr('data-bg') || $(el).attr('data-bg-image') || '';
        if (!bgUrl) {
          const style = $(el).attr('style') || '';
          const bgMatch = style.match(/background(?:-image)?\s*:\s*url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/);
          if (bgMatch) bgUrl = bgMatch[1];
        }
        if (bgUrl && !bgUrl.includes('logo') && !bgUrl.includes('icon') && !bgUrl.startsWith('data:')) {
          candidates.push({ src: bgUrl, weight: 300 });
        }
      });

      // Scan actual img tags
      $('img').each((i, el) => {
        const src = $(el).attr('data-lazy-src') || $(el).attr('data-src') || $(el).attr('src');
        if (!src || src.startsWith('data:') || src.includes('testimonials-star') || src.includes('star.png')) return;
        
        const lowerSrc = src.toLowerCase();
        if (lowerSrc.includes('logo') || lowerSrc.includes('icon') || lowerSrc.includes('avatar') || lowerSrc.includes('spinner') || lowerSrc.endsWith('.svg')) return;

        const width = parseInt($(el).attr('width') || '0', 10);
        const height = parseInt($(el).attr('height') || '0', 10);
        const area = (width || 201) * (height || 201);
        
        let weight = area > 500000 ? 400 : 200;
        if (lowerSrc.includes('attorney') || lowerSrc.includes('team') || lowerSrc.includes('group')) weight += 100;
        candidates.push({ src, weight });
      });

      if (candidates.length > 0) {
        // Sort by weight descending
        candidates.sort((a, b) => b.weight - a.weight);
        image = candidates[0].src;
      }
    }

    // Resolve relative urls
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, url).toString();
      } catch (e) {}
    }
    if (logo && !logo.startsWith('http')) {
      try {
        logo = new URL(logo, url).toString();
      } catch (e) {}
    }

    image = getHighQualityImageUrl(image);
    logo = getHighQualityImageUrl(logo);

    console.log('--- Resolved Final ---');
    console.log('FINAL IMAGE:', image);
    console.log('FINAL LOGO:', logo);

  } catch (e) {
    console.error(e);
  }
}

async function run() {
  await test_enhanced('https://www.emaslaw.com/');
  await test_enhanced('https://www.fihclawgroup.com/');
}

run();
