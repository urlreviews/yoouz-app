import * as cheerio from 'cheerio';

async function testScrape() {
  try {
    const res = await fetch('https://mylawyersadvice.com', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    console.log('Title:', $('title').text().trim());
    console.log('Tel link:', $('a[href^="tel:"]').first().attr('href'));
    console.log('Mailto link:', $('a[href^="mailto:"]').first().attr('href'));

    // Print text content
    const text = $('body').text().replace(/\s+/g, ' ');
    console.log('Body snippet:', text.slice(0, 500));

    // Regex match phone
    const phoneMatch = text.match(/(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
    console.log('Phone Regex Match:', phoneMatch ? phoneMatch[0] : 'None');

    // Regex match email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    console.log('Email Regex Match:', emailMatch ? emailMatch[0] : 'None');

  } catch (e: any) {
    console.error('Scrape error:', e.message);
  }
}

testScrape();
