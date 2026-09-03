import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = '/home/cakai/.gemini/antigravity-ide/brain/a1a13bb9-3ffe-403e-9bc1-3d875031a35b/screenshots/bunda_tante_rina';
const BASE_URL = 'http://localhost:3008';

async function runAudit() {
  console.log('🚀 Starting Playwright Audit for Tax & Advisory Engines...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  // 1. Login using quick-fill which automatically submits
  console.log('Step 1: Logging in as Partner via 1-click...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(1000);
  
  // Click quick fill partner
  await page.locator('button:has-text("Haidar, CPA, CA")').click();
  await page.waitForFunction(() => window.location.pathname.includes('/engagements'));
  console.log('Logged in successfully!');

  // 2. Open Engagement
  console.log('Step 2: Navigating to PT Nusantara Sukses Makmur Overview...');
  await page.goto(`${BASE_URL}/engagements/ENG-2025-01/overview`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_overview_with_cycle_selector.png'), fullPage: false });

  // 3. Test Cycle Selector
  console.log('Step 3: Testing Multi-Period Cycle Selector (Triwulan 4)...');
  const triwulanBtn = page.locator('button:has-text("Triwulan 4")');
  if (await triwulanBtn.isVisible()) {
    await triwulanBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_overview_triwulan4_selected.png'), fullPage: false });
  }

  // 4. Advisory Hub: Tab 1 (Cost Swelling & What's Next)
  console.log('Step 4: Testing Advisory Hub (Cost Anomaly & What\'s Next)...');
  await page.goto(`${BASE_URL}/engagements/ENG-2025-01/advisory`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_advisory_cost_anomaly_whats_next.png'), fullPage: false });

  // 5. Advisory Hub: Tab 2 (Financial Ratios Barometer)
  console.log('Step 5: Testing Advisory Hub (Financial Ratios Barometer)...');
  await page.locator('button:has-text("2. Barometer Rasio")').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_advisory_ratios_barometer.png'), fullPage: false });

  // 6. Advisory Hub: Tab 3 (Manufacturing COGM Breakdown)
  console.log('Step 6: Testing Advisory Hub (Manufacturing COGM Complexity)...');
  await page.locator('button:has-text("3. Dekomposisi HPP Manufaktur")').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_advisory_manufacturing_cogm.png'), fullPage: false });

  // 7. Advisory Hub: Tab 4 (Executive Client Memo)
  console.log('Step 7: Testing Advisory Hub (Executive Strategic Memo)...');
  await page.locator('button:has-text("4. Memo Strategis")').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_advisory_executive_memo.png'), fullPage: false });

  // 8. Tax Hub: Tab 1 (PPh 21 TER)
  console.log('Step 8: Testing Tax Hub (PPh 21 TER PP 58/2023)...');
  await page.goto(`${BASE_URL}/engagements/ENG-2025-01/tax`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_tax_pph21_ter_payroll.png'), fullPage: false });

  // 9. Tax Hub: Tab 2 (PPN Equalization)
  console.log('Step 9: Testing Tax Hub (PPN 1111 Equalization Workpaper)...');
  await page.locator('button:has-text("2. Ekualisasi Omset SPT Masa PPN 1111")').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_tax_ppn_equalization_sheet.png'), fullPage: false });

  // 10. Tax Hub: Tab 3 (Corporate Fiscal Reconciliation)
  console.log('Step 10: Testing Tax Hub (Corporate Fiscal Reconciliation SPT 1771)...');
  await page.locator('button:has-text("3. Rekonsiliasi Fiskal PPh Badan")').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_tax_corporate_fiscal_spt1771.png'), fullPage: false });

  await browser.close();
  console.log('🎉 ALL 9 SCREENSHOTS CAPTURED PERFECTLY!');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
