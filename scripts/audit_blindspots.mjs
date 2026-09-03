import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = '/home/cakai/.gemini/antigravity-ide/brain/a1a13bb9-3ffe-403e-9bc1-3d875031a35b/screenshots/blindspots_solved';
const BASE_URL = 'http://localhost:3008';

async function runAudit() {
  console.log('🚀 Starting Verification of the 3 Blindspots...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  // 1. Quick Login as Partner
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Haidar, CPA, CA")').click();
  await page.waitForFunction(() => window.location.pathname.includes('/engagements'));
  console.log('Logged in successfully!');

  // 2. Open Tax Page & Test Smart Payroll Importer
  console.log('Step 2: Testing Smart Payroll Importer with Excel Klien...');
  await page.goto(`${BASE_URL}/engagements/ENG-2025-01/tax`);
  await page.waitForTimeout(1500);

  // Click Smart Payroll Importer button
  await page.locator('button:has-text("Smart Payroll Importer")').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_smart_payroll_importer_retail.png'), fullPage: false });

  // Click second sample client (CV Maju Logistik)
  await page.locator('button:has-text("File Klien B: Format Logistik")').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_smart_payroll_importer_logistik.png'), fullPage: false });

  // 3. Test Advisory What-If Sensitivity Simulator
  console.log('Step 3: Testing What-If Sensitivity Simulator...');
  await page.goto(`${BASE_URL}/engagements/ENG-2025-01/advisory`);
  await page.waitForTimeout(1500);

  // Click What-If tab
  await page.locator('button:has-text("4. Simulasi Sensitivitas")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_what_if_simulator_live.png'), fullPage: false });

  await browser.close();
  console.log('🎉 ALL 3 BLINDSPOTS SCREENSHOTS CAPTURED PERFECTLY!');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
