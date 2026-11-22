import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE_URL = 'http://127.0.0.1:3000';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'pitch-assets', 'v3');
const CHROMIUM_EXEC =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

async function savePair(page, name) {
  const pngPath = path.join(OUT_DIR, `${name}.png`);
  const webpPath = path.join(OUT_DIR, `${name}.webp`);
  const buf = await page.screenshot({ type: 'png', animations: 'disabled' });
  await sharp(buf).png({ compressionLevel: 8 }).toFile(pngPath);
  await sharp(buf).webp({ quality: 92 }).toFile(webpPath);
  console.log(`Fixed v3/${name} (${Math.round(buf.length / 1024)} KB)`);
}

async function waitForImages(page, ms = 1200) {
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((res) => {
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
          setTimeout(res, 5000);
        });
      })
    );
  });
  await page.waitForTimeout(ms);
}

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    // ---------------------------------------------------------
    // 1. DESKTOP FIXES (1440 x 900 @ 1.5x)
    // ---------------------------------------------------------
    const desktopCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
      colorScheme: 'dark',
    });
    await desktopCtx.addInitScript(() => {
      try {
        localStorage.setItem('yoouz_scratch_users_v6', 'done');
      } catch {}
    });
    const page = await desktopCtx.newPage();

    // Warm up app on homepage
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Live Photo Reviews', { timeout: 30000 });
    await waitForImages(page, 1000);

    // Business Profile Hub (Sephora - full banner + 5 CTAs + live photo)
    await page.goto(`${BASE_URL}/reviews/sephora.com`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button:has-text("Add Review")', { timeout: 30000 });
    await page.waitForSelector('text=sephora.com', { timeout: 20000 }).catch(() => {});
    await waitForImages(page, 1800);
    await savePair(page, 'business-hub-desktop');

    // Photo Reel + Comments Drawer Open (Desktop - Sephora)
    const commentBtn = page.locator('button:has(svg.lucide-message-circle)').first();
    if (await commentBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await commentBtn.click();
      await page.waitForSelector('text=Comments', { timeout: 10000 }).catch(() => {});
      await waitForImages(page, 1000);
    }
    await savePair(page, 'reel-desktop');
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);

    // Redesigned Share Sheet Modal (Desktop - Sephora Photo Review)
    const shareBtn = page.locator('button:has(svg.lucide-share-2)').last();
    if (await shareBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await shareBtn.click();
      await page.waitForSelector('text=Share photo review', { timeout: 10000 }).catch(() => {});
      await waitForImages(page, 1000);
    }
    await savePair(page, 'share-desktop');
    await page.keyboard.press('Escape').catch(() => {});

    // Auto-Assigned U/XXXXXX Profile (Click Profile icon from active app!)
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Live Photo Reviews', { timeout: 25000 });
    await waitForImages(page, 800);
    const profileBtn = page.locator('header button:has(svg.lucide-user)').first();
    if (await profileBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await profileBtn.click();
      await page.waitForTimeout(1800);
      await waitForImages(page, 1000);
    }
    await savePair(page, 'profile-desktop');

    // Messages Workspace (Click envelope icon in header)
    const msgBtn = page.locator('header button:has(svg.lucide-mail)').first();
    if (await msgBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await msgBtn.click();
      await page.waitForTimeout(1500);
      await waitForImages(page, 800);
    }
    await savePair(page, 'messages-desktop');

    await desktopCtx.close();

    // ---------------------------------------------------------
    // 2. EMBED STANDALONE (640 x 820)
    // ---------------------------------------------------------
    const embedCtx = await browser.newContext({
      viewport: { width: 640, height: 820 },
      deviceScaleFactor: 1.5,
      colorScheme: 'dark',
    });
    const embedPage = await embedCtx.newPage();
    await embedPage.goto(`${BASE_URL}/?embed=sephora.com`, { waitUntil: 'domcontentloaded' });
    await embedPage.waitForSelector('text=Sephora', { timeout: 30000 }).catch(() => {});
    await waitForImages(embedPage, 1800);
    await savePair(embedPage, 'embed-standalone');
    await embedCtx.close();

    // ---------------------------------------------------------
    // 3. MOBILE FIXES (390 x 844 @ 2x)
    // ---------------------------------------------------------
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    });
    await mobileCtx.addInitScript(() => {
      try {
        localStorage.setItem('yoouz_scratch_users_v6', 'done');
      } catch {}
    });
    const mPage = await mobileCtx.newPage();

    // Warm up on mobile home
    await mPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForSelector('text=Live Photo Reviews', { timeout: 30000 });
    await waitForImages(mPage, 1000);

    // Mobile Business Profile Hub (Sephora - QR Landing Screen)
    await mPage.goto(`${BASE_URL}/reviews/sephora.com`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForSelector('button:has-text("Add Review")', { timeout: 30000 });
    await waitForImages(mPage, 1600);
    await savePair(mPage, 'business-hub-mobile');

    // Mobile Camera Capture Gate (Click Add Review on Sephora profile)
    const addRevMobile = mPage.locator('button:has-text("Add Review")').first();
    await addRevMobile.click();
    await mPage.waitForSelector('text=Open Camera', { timeout: 10000 }).catch(() => {});
    await mPage.waitForTimeout(900);
    await savePair(mPage, 'camera-mobile');

    // Close Camera & Open Full-Bleed Mobile Photo Reel
    await mPage.goto(`${BASE_URL}/reviews/sephora.com`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForSelector('button:has-text("Add Review")', { timeout: 30000 });
    await waitForImages(mPage, 1200);

    // Tap the photo card inside Sephora business profile to launch full-screen Photo Reel
    const tappedThumb = await mPage.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img')).filter((im) => {
        const r = im.getBoundingClientRect();
        return r.width > 100 && r.height > 120 && r.top > 250;
      });
      if (imgs[0]) {
        (imgs[0].closest('button') || imgs[0]).click();
        return true;
      }
      return false;
    });
    console.log('Mobile reel thumbnail tapped:', tappedThumb);
    await mPage.waitForTimeout(1400);
    await waitForImages(mPage, 1000);
    await savePair(mPage, 'reel-mobile');

    // Mobile Share Sheet Modal (tap Share button on Reel)
    const mShareBtn = mPage.locator('button:has(svg.lucide-share-2)').first();
    if (await mShareBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await mShareBtn.click();
      await mPage.waitForSelector('text=Share photo review', { timeout: 10000 }).catch(() => {});
      await waitForImages(mPage, 1000);
    }
    await savePair(mPage, 'share-mobile');

    // Mobile Profile Page (from Home -> bottom dock Profile)
    await mPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForSelector('text=Live Photo Reviews', { timeout: 25000 });
    await waitForImages(mPage, 800);
    const mProfBtn = mPage.locator('nav button:has(svg.lucide-user), footer button:has(svg.lucide-user), button:has(svg.lucide-user)').last();
    if (await mProfBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await mProfBtn.click();
      await mPage.waitForTimeout(1600);
      await waitForImages(mPage, 800);
    }
    await savePair(mPage, 'profile-mobile');

    // Mobile Messages (from Home -> bottom dock Messages)
    await mPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForSelector('text=Live Photo Reviews', { timeout: 25000 });
    await waitForImages(mPage, 600);
    const mMsgBtn = mPage.locator('button:has-text("Messages")').first();
    if (await mMsgBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await mMsgBtn.click();
      await mPage.waitForTimeout(1400);
      await waitForImages(mPage, 800);
    }
    await savePair(mPage, 'messages-mobile');

    await mobileCtx.close();

    // ---------------------------------------------------------
    // 4. LIVE 1200x630 OPENGRAPH CARD WITH REAL PHOTO & LOGO
    // ---------------------------------------------------------
    const ogUrl = `${BASE_URL}/api/og-card/v18/rev_sephora_cosmetics_15.png?placeName=Sephora&placeDomain=sephora.com&placeRating=5.0&placeReviewsCount=1&rating=5&category=Beauty&author=Aiko%20Tanaka&authorVerified=true&v=48`;
    const ogResp = await fetch(ogUrl);
    if (ogResp.ok) {
      const ogBuf = Buffer.from(await ogResp.arrayBuffer());
      await sharp(ogBuf).png({ compressionLevel: 8 }).toFile(path.join(OUT_DIR, 'og-card-sample.png'));
      await sharp(ogBuf).webp({ quality: 92 }).toFile(path.join(OUT_DIR, 'og-card-sample.webp'));
      console.log(`Fixed v3/og-card-sample (${Math.round(ogBuf.length / 1024)} KB)`);
    }

    console.log('ALL TARGETED V3 FIXES COMPLETED!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('V3 fix failed:', err);
  process.exit(1);
});
