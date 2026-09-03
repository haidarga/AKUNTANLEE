const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://akuntanlee.vercel.app';
const OUT_DIR = path.join(__dirname, '../public/presentation/screenshots_all');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 14. Advisory Memo
  console.log('14. Capturing Advisory Memo...');
  await page.goto(`${BASE_URL}/engagements/ENG-2026-01/advisory`, { waitUntil: 'networkidle' });
  await page.locator('button:has-text("Memo")').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/14_advisory_executive_memo.png` });

  // 15. Modul 6: Tax Hub - PPh 21 TER
  console.log('15. Capturing Tax Tab 1 (PPh 21 TER)...');
  await page.goto(`${BASE_URL}/engagements/ENG-2026-01/tax`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/15_tax_pph21_ter.png` });

  // 16. Modul 6: Tax Hub - Smart Payroll Importer
  console.log('16. Capturing Smart Payroll Importer Drawer...');
  try {
    await page.click('button:has-text("Impor Rekap Gaji")');
    await page.waitForTimeout(1000);
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
  await page.waitForTimeout(1000);
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
  console.log('✅ Copied all 20 screenshots to brain artifact directory!');

  // Now render the Presentation HTML to a real, beautiful A4 Landscape PDF!
  console.log('📄 RENDERING MASTER PRESENTATION PDF FROM public/presentation/index.html...');
  const htmlPath = 'file://' + path.join(__dirname, '../public/presentation/index.html');
  await page.goto(htmlPath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

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
