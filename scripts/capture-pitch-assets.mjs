import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE_URL = 'http://127.0.0.1:3000';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'pitch-assets', 'v2');
const CHROMIUM_EXEC = '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

fs.mkdirSync(OUT_DIR, { recursive: true });

async function savePair(page, name) {
  const pngPath = path.join(OUT_DIR, `${name}.png`);
  const webpPath = path.join(OUT_DIR, `${name}.webp`);
  const buf = await page.screenshot({
    type: 'png',
    animations: 'disabled',
  });
  await sharp(buf).png({ compressionLevel: 8 }).toFile(pngPath);
  await sharp(buf).webp({ quality: 90 }).toFile(webpPath);
  console.log(`Captured ${name}.png & ${name}.webp (${Math.round(buf.length / 1024)} KB raw)`);
}

async function waitForRouteContent(page, textMatch, extraMs = 1000) {
  await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {});
  if (textMatch) {
    await page
      .waitForFunction(
        (needle) => {
          const text = document.body?.innerText || '';
          return text.toLowerCase().includes(needle.toLowerCase());
        },
        textMatch,
        { timeout: 25000 }
      )
      .catch(() => console.warn(`Timed out waiting for text "${textMatch}" on ${page.url()}`));
  }
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((res) => {
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
          setTimeout(res, 4000);
        });
      })
    );
  });
  await page.waitForTimeout(extraMs);
}

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    // ---------------------------------------------------------
    // 1. DESKTOP CONTEXT (1440 x 900)
    // ---------------------------------------------------------
    const desktopCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    });
    const page = await desktopCtx.newPage();
    page.on('pageerror', (err) => console.warn('Page error:', err.message));

    // 01: Home Discovery (New Obsidian Top-Nav Homepage)
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(page, 'Live Photo Proof', 1200);
    await savePair(page, '01-home-discovery');

    // 02: Instant Live Search Dropdown
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.click();
    await searchInput.fill('s');
    await page.waitForTimeout(1600);
    await savePair(page, '02-search-autoscraping');
    await page.keyboard.press('Escape').catch(() => {});

    // 06: Business Profile Hub (Wolt)
    await page.goto(`${BASE_URL}/reviews/wolt.com`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(page, 'Wolt', 1600);
    await savePair(page, '06-business-profile-hub');

    // 03: Tabletop QR Standee Modal on Wolt Business Hub
    const qrBtn = page.locator('button[title*="QR" i], button[aria-label*="QR" i]').first();
    if (await qrBtn.isVisible().catch(() => false)) {
      await qrBtn.click();
      await page.waitForTimeout(1000);
      await savePair(page, '03-qr-business-front');
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
    } else {
      console.warn('QR button not found on /reviews/wolt.com');
    }

    // 07: Comments & Social Rail on Wolt Business Hub
    await page.goto(`${BASE_URL}/reviews/wolt.com`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(page, 'Wolt', 1500);
    const commentClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => {
        const label = (b.getAttribute('aria-label') || b.getAttribute('title') || '').toLowerCase();
        return label.includes('comment');
      });
      if (target) {
        target.click();
        return true;
      }
      // Look for the MessageCircle SVG button in the vertical social rail
      const rail = btns.find((b) => b.querySelector('svg.lucide-message-circle'));
      if (rail) {
        rail.click();
        return true;
      }
      return false;
    });
    console.log('Comment button clicked:', commentClicked);
    await page.waitForTimeout(1200);
    await savePair(page, '07-comments-social-rail');

    // 05 & 06-passkey-live-app: U/XXXXXX Profile & Passkey Page
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(page, 'U/', 1600);
    await savePair(page, '06-passkey-live-app');
    await savePair(page, '05-uhandle-profile');

    // 09: Direct Messaging (seed a clean conversation so it looks rich & active)
    await page.goto(`${BASE_URL}/messages`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(page, 'Messages', 1400);
    await savePair(page, '09-messages-direct-chat');

    // 13: Localized Spanish SEO Page (/es/reviews/sephora.com)
    await page.goto(`${BASE_URL}/es/reviews/sephora.com`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(page, 'Sephora', 1800);
    await savePair(page, '13-seo-localized-page');

    // 14: Claimed Businesses & Live Proof Showcase (Books And Beans)
    await page.goto(`${BASE_URL}/reviews/booksandbeans.co.uk`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(page, 'Books And Beans', 1600);
    await savePair(page, '14-claimed-businesses');

    // 12: Brand-New Apple/Google Redesigned Business Dashboard (Desktop)
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(page, 'Yoouz', 500);
    await page.evaluate(() => {
      localStorage.setItem(
        'copo_business_verified_session',
        JSON.stringify({
          placeId: 'wolt.com',
          placeName: 'Wolt',
          domain: 'wolt.com',
          website: 'https://wolt.com',
          verified: true,
          plan: 'pro',
          claimedAt: new Date().toISOString(),
          logoUrl: '/uploads/brand-assets/logos/wolt.com.svg',
        })
      );
    });
    await page.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(page, 'Wolt', 2000);
    await savePair(page, '12-business-portal');

    await desktopCtx.close();

    // ---------------------------------------------------------
    // 2. EMBED WIDGET STANDALONE (640 x 820)
    // ---------------------------------------------------------
    const embedCtx = await browser.newContext({
      viewport: { width: 640, height: 820 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    });
    const embedPage = await embedCtx.newPage();
    await embedPage.goto(`${BASE_URL}/?embed=wolt.com`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(embedPage, 'Wolt', 1800);
    await savePair(embedPage, '10b-embed-standalone');
    await embedCtx.close();

    // ---------------------------------------------------------
    // 3. MOBILE PWA CONTEXT (390 x 844 @ 2x DPR)
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
    const mPage = await mobileCtx.newPage();
    mPage.on('pageerror', (err) => console.warn('Mobile page error:', err.message));

    // 08: Mobile PWA Home
    await mPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(mPage, 'Live Photo Proof', 1400);
    await savePair(mPage, '08-mobile-home');

    // 08b: Mobile Navigation Drawer (Brand-New Apple/Google Sheet Design)
    const menuClicked = await mPage.evaluate(() => {
      const headerBtns = Array.from(document.querySelectorAll('header button, nav button'));
      // Top-right 2-line hamburger button in the mobile header
      const menuBtn = headerBtns.find((b) => {
        const label = (b.getAttribute('aria-label') || '').toLowerCase();
        return label.includes('menu') || label.includes('nav');
      }) || headerBtns[headerBtns.length - 1];
      if (menuBtn) {
        menuBtn.click();
        return true;
      }
      return false;
    });
    console.log('Mobile menu clicked:', menuClicked);
    await mPage.waitForTimeout(900);
    await savePair(mPage, '08b-mobile-drawer');

    // 11: Mobile Business Front (Wolt)
    await mPage.goto(`${BASE_URL}/reviews/wolt.com`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(mPage, 'Wolt', 1600);
    await savePair(mPage, '11-mobile-business-front');

    // 04: Mobile 3-Second Native Camera Flow (click visible Add Review button)
    const camClicked = await mPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const visibleAdd = btns.find((b) => {
        const rect = b.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return /add review/i.test(b.innerText || '');
      });
      if (visibleAdd) {
        visibleAdd.click();
        return true;
      }
      return false;
    });
    console.log('Mobile Add Review clicked:', camClicked);
    await mPage.waitForTimeout(1200);
    await savePair(mPage, '04-mobile-camera-flow');

    // 15: Mobile PWA Full-Bleed Feed (Sephora)
    await mPage.goto(`${BASE_URL}/reviews/sephora.com`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(mPage, 'Sephora', 1600);
    await savePair(mPage, '15-mobile-pwa-feed');

    // 12b: Mobile PWA Business Dashboard (Wolt)
    await mPage.evaluate(() => {
      localStorage.setItem(
        'copo_business_verified_session',
        JSON.stringify({
          placeId: 'wolt.com',
          placeName: 'Wolt',
          domain: 'wolt.com',
          website: 'https://wolt.com',
          verified: true,
          plan: 'pro',
          claimedAt: new Date().toISOString(),
          logoUrl: '/uploads/brand-assets/logos/wolt.com.svg',
        })
      );
    });
    await mPage.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded' });
    await waitForRouteContent(mPage, 'Wolt', 2000);
    await savePair(mPage, '12b-business-portal-mobile');

    await mobileCtx.close();

    // ---------------------------------------------------------
    // 4. COMPOSITE 06-passkey-settings (New App + iPhone Passkey)
    // ---------------------------------------------------------
    const leftImgPath = path.join(OUT_DIR, '06-passkey-live-app.png');
    const rightImgPath = path.join(OUT_DIR, '06-iphone-passkey-prompt.png');
    if (fs.existsSync(leftImgPath) && fs.existsSync(rightImgPath)) {
      const leftResized = await sharp(leftImgPath).resize(880, 560, { fit: 'cover' }).toBuffer();
      const rightResized = await sharp(rightImgPath).resize(460, 560, { fit: 'cover' }).toBuffer();
      const compositeBuf = await sharp({
        create: {
          width: 1440,
          height: 680,
          channels: 4,
          background: { r: 7, g: 7, b: 9, alpha: 1 },
        },
      })
        .composite([
          { input: leftResized, left: 40, top: 60 },
          { input: rightResized, left: 940, top: 60 },
        ])
        .png({ compressionLevel: 8 })
        .toBuffer();

      await sharp(compositeBuf).png({ compressionLevel: 8 }).toFile(path.join(OUT_DIR, '06-passkey-settings.png'));
      await sharp(compositeBuf).webp({ quality: 90 }).toFile(path.join(OUT_DIR, '06-passkey-settings.webp'));
      console.log('Composited 06-passkey-settings.png & .webp');
    }

    console.log('ALL PITCH ASSETS CAPTURED SUCCESSFULLY.');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
