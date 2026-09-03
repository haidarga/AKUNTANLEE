const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://akuntanlee.vercel.app';
const OUT_DIR = path.join(__dirname, '../public/presentation/screenshots_all');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

(async () => {
  console.log('📸 STARTING PHOTO-SHOOT OF ALL SECTIONS ON LIVE PRODUCTION...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Landing Page Hero
  console.log('1. Capturing Landing Page...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/01_landing_hero.png` });

  // 2. Settings / Firm Profile
  console.log('2. Capturing Settings / KAP Profile...');
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/02_settings_firm_profile.png` });

  // 3. Onboarding Wizard
  console.log('3. Capturing Onboarding Wizard...');
  await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/03_onboarding_wizard.png` });

  // 4. Engagements Directory
  console.log('4. Capturing Engagements Directory...');
  await page.goto(`${BASE_URL}/engagements`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/04_engagements_directory.png` });

  // 5. Modul 1: Overview FY 2026
  console.log('5. Capturing Overview FY 2026...');
  await page.goto(`${BASE_URL}/engagements/ENG-2026-01/overview`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT_DIR}/05_overview_fy2026.png` });

  // 6. Modul 2: Files / Berkas Sumber
  console.log('6. Capturing Berkas Sumber...');
  await page.goto(`${BASE_URL}/engagements/ENG-2026-01/files`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT_DIR}/06_files_source.png` });

  // 7. Modul 3: Pemetaan SAK Table
  console.log('7. Capturing Pemetaan SAK Table...');
  await page.goto(`${BASE_URL}/engagements/ENG-2026-01/mapping`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT_DIR}/07_mapping_table.png` });

  // 8. Modul 3: AI Reasoning Modal
  console.log('8. Capturing AI Reasoning Modal...');
  try {
    await page.locator('button[title="Buka Analisis Semantik AI"]').first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT_DIR}/08_ai_reasoning_modal.png` });
    await page.keyboard.press('Escape');
  } catch (e) {
    console.warn('AI modal warning:', e.message);
  }

  // 9. Modul 4: Workpaper Waterfall & Lead Schedule
  console.log('9. Capturing Workpaper Lead Schedule...');
  await page.goto(`${BASE_URL}/engagements/ENG-2026-01/workpaper`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT_DIR}/09_workpaper_waterfall.png` });

  // 10. Modul 5: Advisory Hub - Diagnosa Anomali Biaya
  console.log('10. Capturing Advisory Tab 1 (Diagnosa Biaya)...');
  await page.goto(`${BASE_URL}/engagements/ENG-2026-01/advisory`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT_DIR}/10_advisory_cost_anomaly.png` });

  // 11. Modul 5: Advisory Hub - Rasio AAA
  console.log('11. Capturing Advisory Tab 2 (Barometer Rasio AAA)...');
  await page.click('button:has-text("2. Barometer Rasio Finansial")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/11_advisory_ratios_aaa.png` });

  // 12. Modul 5: Advisory Hub - COGM Manufaktur
  console.log('12. Capturing Advisory Tab 3 (COGM Manufaktur)...');
  await page.click('button:has-text("3. Analisis Biaya Pokok Produksi Pabrik")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/12_advisory_manufacturing_cogm.png` });

  // 13. Modul 5: Advisory Hub - What-If Simulator
  console.log('13. Capturing Advisory Tab 4 (What-If Simulator)...');
  await page.click('button:has-text("4. Simulasi Sensitivitas Skenario Bisnis")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/13_advisory_what_if_simulator.png` });

  // 14. Modul 5: Advisory Hub - Memo Eksekutif
  console.log('14. Capturing Advisory Tab 5 (Executive Memo)...');
  await page.click('button:has-text("5. Memo Rekomendasi Eksekutif")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/14_advisory_executive_memo.png` });

  // 15. Modul 6: Tax Hub - PPh 21 TER
  console.log('15. Capturing Tax Tab 1 (PPh 21 TER)...');
  await page.goto(`${BASE_URL}/engagements/ENG-2026-01/tax`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT_DIR}/15_tax_pph21_ter.png` });

  // 16. Modul 6: Tax Hub - Smart Payroll Importer
  console.log('16. Capturing Smart Payroll Importer Drawer...');
  try {
    await page.click('button:has-text("Impor Rekap Gaji")');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT_DIR}/16_tax_payroll_importer.png` });
    await page.keyboard.press('Escape');
  } catch (e) {
    console.warn('Payroll importer warning:', e.message);
  }

  // 17. Modul 6: Tax Hub - Ekualisasi PPN 1111
  console.log('17. Capturing Tax Tab 2 (Ekualisasi PPN 1111)...');
  await page.click('button:has-text("2. Ekualisasi Omset Penjualan vs SPT Masa PPN 1111")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/17_tax_ppn_equalization.png` });

  // 18. Modul 6: Tax Hub - Rekonsiliasi SPT 1771
  console.log('18. Capturing Tax Tab 3 (Rekonsiliasi Fiskal SPT 1771)...');
  await page.click('button:has-text("3. Rekonsiliasi & Koreksi Fiskal PPh Badan")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/18_tax_spt1771_fiscal.png` });

  // 19. Modul 7: Ekspor Resmi & Berkas DJP
  console.log('19. Capturing Ekspor Resmi...');
  await page.goto(`${BASE_URL}/engagements/ENG-2026-01/exports`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT_DIR}/19_exports_center.png` });

  // 20. Login Portal VIP Keys
  console.log('20. Capturing Login Portal VIP Keys...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/20_login_vip_access.png` });

  // Also copy all screenshots to brain artifacts directory so user can view directly
  const brainScreenshots = '/home/cakai/.gemini/antigravity-ide/brain/a1a13bb9-3ffe-403e-9bc1-3d875031a35b/screenshots/guide_sections';
  if (!fs.existsSync(brainScreenshots)) {
    fs.mkdirSync(brainScreenshots, { recursive: true });
  }
  const files = fs.readdirSync(OUT_DIR);
  for (const f of files) {
    fs.copyFileSync(path.join(OUT_DIR, f), path.join(brainScreenshots, f));
  }
  console.log('✅ Copied all screenshots to brain artifact directory!');

  // Now render the Presentation HTML to a real, beautiful A4 Landscape PDF!
  console.log('📄 RENDERING MASTER PRESENTATION PDF FROM public/presentation/index.html...');
  const htmlPath = 'file://' + path.join(__dirname, '../public/presentation/index.html');
  await page.goto(htmlPath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const pdfPath = path.join(__dirname, '../public/presentation/FINOVA_AI_Executive_Presentation_FY2026.pdf');
  const brainPdf = '/home/cakai/.gemini/antigravity-ide/brain/a1a13bb9-3ffe-403e-9bc1-3d875031a35b/FINOVA_AI_Executive_Presentation_FY2026.pdf';

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
  });

  fs.copyFileSync(pdfPath, brainPdf);
  console.log('🎉 REAL PDF GENERATED SUCCESSFULLY AT:');
  console.log('1. ' + pdfPath);
  console.log('2. ' + brainPdf);

  await browser.close();
})();
