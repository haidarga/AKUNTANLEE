const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIDEO_DIR = '/home/cakai/.gemini/antigravity-ide/brain/a1a13bb9-3ffe-403e-9bc1-3d875031a35b/videos';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Smooth scroll helper
async function smoothScroll(page, targetY, durationMs = 700) {
  await page.evaluate(async ({ targetY, durationMs }) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();

    return new Promise((resolve) => {
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, startY + diff * ease);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }, { targetY, durationMs });
  await sleep(durationMs + 100);
}

// Visual cursor indicator helper
async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('finova-demo-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = 'finova-demo-cursor';
    cursor.style.position = 'fixed';
    cursor.style.top = '100px';
    cursor.style.left = '100px';
    cursor.style.width = '20px';
    cursor.style.height = '20px';
    cursor.style.borderRadius = '50%';
    cursor.style.backgroundColor = 'rgba(15, 143, 122, 0.85)';
    cursor.style.border = '2.5px solid white';
    cursor.style.boxShadow = '0 3px 12px rgba(0,0,0,0.35)';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '999999';
    cursor.style.transition = 'transform 0.15s ease-out, background-color 0.15s ease, left 0.25s cubic-bezier(0.25, 1, 0.5, 1), top 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
    cursor.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(cursor);

    window.moveCursor = (x, y) => {
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    };

    window.clickCursor = () => {
      cursor.style.backgroundColor = 'rgba(200, 62, 77, 0.95)';
      cursor.style.transform = 'translate(-50%, -50%) scale(0.75)';
      setTimeout(() => {
        cursor.style.backgroundColor = 'rgba(15, 143, 122, 0.85)';
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 180);
    };
  });
}

async function moveMouseToElement(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 4000 });
    const el = await page.$(selector);
    if (!el) return null;
    const box = await el.boundingBox();
    if (box) {
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.evaluate(({ x, y }) => {
        if (window.moveCursor) window.moveCursor(x, y);
      }, { x, y });
      await page.mouse.move(x, y, { steps: 8 });
      return box;
    }
  } catch (e) {
    console.log(`Could not move to: ${selector}`);
  }
  return null;
}

async function clickElement(page, selector) {
  await moveMouseToElement(page, selector);
  await sleep(200);
  await page.evaluate(() => { if (window.clickCursor) window.clickCursor(); });
  await page.click(selector);
  await sleep(400);
}

(async () => {
  console.log('🚀 Starting Full Bulletproof E2E Video Recording...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // SCENE 1: LOGIN & PERSONA SWITCHER
    // -------------------------------------------------------------
    console.log('📍 Scene 1: Login & Persona Switcher');
    await page.goto('http://localhost:3008/login', { waitUntil: 'networkidle' });
    await injectCursor(page);
    await sleep(1000);

    // Select Senior In-Charge
    await clickElement(page, 'text=Ahmad Pratama, S.Ak');
    await sleep(600);

    // Click Submit
    await clickElement(page, 'button:has-text("Masuk Sebagai")');
    await page.waitForURL('**/overview', { timeout: 6000 });
    console.log('✅ Navigated to Overview!');

    // -------------------------------------------------------------
    // SCENE 2: ENGAGEMENT OVERVIEW
    // -------------------------------------------------------------
    console.log('📍 Scene 2: Engagement Overview');
    await injectCursor(page);
    await sleep(1000);

    // Hover Next Action banner
    await moveMouseToElement(page, 'text=Selesaikan Pemetaan');
    await sleep(800);

    // Scroll down to view Balance Scale Gauge
    await smoothScroll(page, 320, 600);
    await moveMouseToElement(page, 'text=SEIMBANG SEMPURNA');
    await sleep(1000);

    // Scroll up and click "Files" tab
    await smoothScroll(page, 0, 400);
    await clickElement(page, 'a[href$="/files"]');
    await page.waitForURL('**/files', { timeout: 6000 });
    console.log('✅ Navigated to Files!');

    // -------------------------------------------------------------
    // SCENE 3: FILES & SOURCE VAULT
    // -------------------------------------------------------------
    console.log('📍 Scene 3: Files & Source Vault');
    await injectCursor(page);
    await sleep(1000);

    // Scroll to view Dropzone
    await smoothScroll(page, 350, 600);
    await moveMouseToElement(page, 'text=Pilih Berkas Spreadsheet');
    await sleep(800);

    // Scroll down to inspect SHA-256 version cards
    await smoothScroll(page, 550, 600);
    await sleep(1000);

    // Click "Konfigurasi Import"
    await clickElement(page, 'a[href*="/imports/"]');
    await page.waitForURL('**/imports/**', { timeout: 6000 });
    console.log('✅ Navigated to Import Setup!');

    // -------------------------------------------------------------
    // SCENE 4: IMPORT SETUP
    // -------------------------------------------------------------
    console.log('📍 Scene 4: Import Setup');
    await injectCursor(page);
    await sleep(1000);

    // Scroll to inspect 5-row preview
    await smoothScroll(page, 320, 600);
    await sleep(1200);

    // Scroll up and click "Account Mapping"
    await smoothScroll(page, 0, 400);
    await clickElement(page, 'a[href$="/mapping"]');
    await page.waitForURL('**/mapping', { timeout: 6000 });
    console.log('✅ Navigated to Account Mapping!');

    // -------------------------------------------------------------
    // SCENE 5: ACCOUNT MAPPING & AI REASONING INSPECTOR
    // -------------------------------------------------------------
    console.log('📍 Scene 5: Account Mapping & AI Reasoning Inspector');
    await injectCursor(page);
    await sleep(1000);

    // Click "Perlu Review" filter tab
    await clickElement(page, 'button:has-text("Perlu Review")');
    await sleep(1000);

    // Scroll down to view row 2199-00
    await smoothScroll(page, 280, 500);
    await sleep(800);

    // Click the green "[AI]" button!
    console.log('✨ Clicking [AI] button...');
    await clickElement(page, 'button[title="Buka Analisis Semantik AI"]');
    await sleep(3000); // Admire the FINOVA AI Semantic Reasoning Inspector modal

    // Click "Terapkan WP-F.4 ->"
    console.log('🎯 Applying AI recommendation to WP-F.4...');
    await clickElement(page, 'button:has-text("Terapkan WP-F.4")');
    await sleep(1800);

    // Click "Semua Akun" tab
    await smoothScroll(page, 0, 400);
    await clickElement(page, 'button:has-text("Semua Akun")');
    await sleep(1200);

    // Click "Workpaper" tab
    await clickElement(page, 'a[href$="/workpaper"]');
    await page.waitForURL('**/workpaper', { timeout: 6000 });
    console.log('✅ Navigated to Workpaper!');

    // -------------------------------------------------------------
    // SCENE 6: LEAD SCHEDULE & INTERACTIVE SPREADSHEET
    // -------------------------------------------------------------
    console.log('📍 Scene 6: Lead Schedule & Interactive Spreadsheet');
    await injectCursor(page);
    await sleep(1000);

    // Scroll to Financial Waterfall Bridge Chart
    await smoothScroll(page, 200, 500);
    await moveMouseToElement(page, 'text=Pendapatan Usaha');
    await sleep(600);
    await moveMouseToElement(page, 'text=HPP / COGS');
    await sleep(600);
    await moveMouseToElement(page, 'text=Laba Kotor');
    await sleep(600);
    await moveMouseToElement(page, 'text=Beban Operasional');
    await sleep(600);
    await moveMouseToElement(page, 'text=Laba Bersih Tahun Berjalan');
    await sleep(800);

    // Scroll down to AuditSpreadsheet
    await smoothScroll(page, 750, 700);
    await sleep(1000);

    // Simulate keyboard navigation on spreadsheet
    console.log('⌨️ Navigating active cells via keyboard...');
    await page.keyboard.press('ArrowDown');
    await sleep(400);
    await page.keyboard.press('ArrowDown');
    await sleep(400);
    await page.keyboard.press('ArrowRight');
    await sleep(400);
    await page.keyboard.press('ArrowUp');
    await sleep(600);

    // Click Lineage button on WP-A.1
    console.log('🔍 Opening Evidence Lineage Drawer...');
    await clickElement(page, 'button[title*="Lineage Bukti Sumber"]');
    await sleep(2500); // Admire the drawer with raw coordinates & SHA-256

    // Close Lineage drawer
    await clickElement(page, 'button:has-text("Tutup")');
    await sleep(800);

    // Click "Lanjut ke Ekspor XLSX"
    await smoothScroll(page, 450, 500);
    await clickElement(page, 'a[href$="/exports"]');
    await page.waitForURL('**/exports', { timeout: 6000 });
    console.log('✅ Navigated to Exports!');

    // -------------------------------------------------------------
    // SCENE 7: OFFICIAL XLSX EXPORT CENTER
    // -------------------------------------------------------------
    console.log('📍 Scene 7: Official XLSX Export Center');
    await injectCursor(page);
    await sleep(1200);

    // Inspect Isometric 3D Workbook preview
    await smoothScroll(page, 250, 600);
    await sleep(1500);

    // Scroll to verified XLSX download card
    await smoothScroll(page, 550, 600);
    await sleep(1000);

    // Click "Unduh Berkas XLSX"
    console.log('📥 Clicking Unduh Berkas XLSX...');
    await clickElement(page, 'button:has-text("Unduh Berkas XLSX")');
    await sleep(2000);

    console.log('🎉 Full End-to-End Walkthrough Completed with Absolute Perfection!');
  } catch (err) {
    console.error('❌ Error during E2E walkthrough:', err);
  } finally {
    await context.close();
    await browser.close();
  }
})();
