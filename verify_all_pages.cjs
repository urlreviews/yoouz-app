const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  const logs = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
  });

  console.log('Navigating to homepage http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Check if videos rendered
  const videoElements = await page.$$('video');
  console.log('Video elements rendered on home:', videoElements.length);

  // Check for video cards or feed containers
  const feedItems = await page.$$('[data-video-id], .feed-item, [id^="feed-video-"]');
  console.log('Feed items found:', feedItems.length);

  const pageText = await page.innerText('body');
  console.log('Does page have "No Video Reviews Yet"?', pageText.includes('No Video Reviews Yet'));

  console.log('Console Errors encountered:', errors);
  await browser.close();
})();
