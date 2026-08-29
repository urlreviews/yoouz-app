const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });

  page.on('request', request => {
    if (request.url().includes('/api/videos/feed')) {
      console.log('API REQUEST:', request.url());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/videos/feed')) {
      console.log('API RESPONSE STATUS:', response.status());
      try {
        const json = await response.json();
        console.log('API RESPONSE DATA LENGTH:', json.videos?.length);
      } catch (e) {
        console.log('API RESPONSE JSON ERROR:', e.message);
      }
    }
  });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Wait for React to do its thing
  await page.waitForTimeout(5000);

  const videosFound = await page.evaluate(() => {
    return document.querySelectorAll('video').length;
  });
  console.log('DOM VIDEOS COUNT:', videosFound);

  const textFound = await page.evaluate(() => {
    return document.body.innerText.includes('No Video Reviews Yet');
  });
  console.log('NO VIDEOS MESSAGE PRESENT:', textFound);

  await browser.close();
})();
