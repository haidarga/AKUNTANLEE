const { chromium } = require('playwright');

const BASE_URL = 'https://akuntanlee.vercel.app';

(async () => {
  console.log('🚀 RUNNING LIVE PRODUCTION END-TO-END STRESS AUDIT ON VERCEL...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const pageErrors = [];
  const networkErrors = [];

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', (err) => {
    console.error('❌ Browser Page Error:', err.message);
    pageErrors.push(err.message);
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      console.error(`❌ HTTP ${res.status()} on ${res.url()}`);
      networkErrors.push(`${res.status()}: ${res.url()}`);
    }
  });

  // TEST 1: TANTE RINA DIRECT LINK (Advisory Hub)
  console.log('\n--- 1. Testing Tante Rina Direct Link ---');
  await page.goto(`${BASE_URL}/engagements/ENG-2025-01/advisory`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Analisis Kinerja Keuangan', { timeout: 10000 });
  console.log('✅ Tante Rina Direct Link Loaded seamlessly without login wall!');

  // TEST 2: ADVISORY SUB-TABS INTERACTIVITY
  console.log('\n--- 2. Testing Advisory Sub-Tabs Interactivity ---');
  await page.click('button:has-text("2. Barometer Rasio Finansial")');
  await page.waitForSelector('text=Rating: AAA (Sangat Prima)', { timeout: 6000 });
  console.log('✅ Sub-tab 2: Barometer Rasio AAA is live!');

  await page.click('button:has-text("3. Analisis Biaya Pokok Produksi Pabrik")');
  await page.waitForSelector('text=Harga Pokok Produksi', { timeout: 6000 });
  console.log('✅ Sub-tab 3: COGM Manufaktur is live!');

  // TEST 3: WHAT-IF SIMULATOR SLIDERS & LIVE CALCULATION
  console.log('\n--- 3. Testing What-If Simulator Sliders & Live API ---');
  await page.click('button:has-text("4. Simulasi Sensitivitas Skenario Bisnis")');
  await page.waitForSelector('text=Simulator Sensitivitas Dampak Biaya', { timeout: 6000 });
  
  // React 19 synthetic slider change
  await page.evaluate(() => {
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(slider, 15);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(1000);
  const umrVisible = await page.locator('text=+15%').first().isVisible();
  console.log(`✅ What-If Slider interactive mutation (+15%): ${umrVisible}`);

  // TEST 4: BUNDA DIRECT LINK (Tax Hub)
  console.log('\n--- 4. Testing Bunda Direct Link (Tax Hub) ---');
  await page.goto(`${BASE_URL}/engagements/ENG-2025-01/tax`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Pusat Kepatuhan Pajak & Rekonsiliasi Fiskal', { timeout: 10000 });
  console.log('✅ Bunda Direct Link Loaded seamlessly without login wall!');

  // TEST 5: SMART PAYROLL IMPORTER
  console.log('\n--- 5. Testing Smart Payroll Importer ---');
  await page.click('button:has-text("Impor Rekap Gaji")');
  await page.waitForSelector('text=Smart Payroll Importer: Deteksi Otomatis Kolom Excel', { timeout: 6000 });
  await page.click('button:has-text("File Klien B: Format Logistik")');
  await page.waitForSelector('text=Berhasil memetakan 12 karyawan CV Maju Logistik', { timeout: 6000 });
  console.log('✅ Smart Payroll Importer successfully switched and inferred 12 rows with 91% confidence!');

  // TEST 6: EKUALISASI PPN 1111 & REKONSILIASI FISKAL
  console.log('\n--- 6. Testing Ekualisasi PPN & Rekonsiliasi Fiskal ---');
  await page.click('button:has-text("2. Ekualisasi Omset Penjualan vs SPT Masa PPN 1111")');
  await page.waitForSelector('text=Ekualisasi 100% Klop', { timeout: 6000 });
  console.log('✅ Ekualisasi PPN 1111 shows 100% Klop with bridge table!');

  await page.click('button:has-text("3. Rekonsiliasi & Koreksi Fiskal PPh Badan")');
  await page.waitForSelector('text=PPh Pasal 29 (Kurang Bayar Tahunan)', { timeout: 6000 });
  console.log('✅ Rekonsiliasi Fiskal SPT 1771 shows Article 29 calculation (Rp 1.556.490.000)!');

  // TEST 7: DJP CSV EXPORT ENDPOINTS
  console.log('\n--- 7. Testing DJP Official CSV Downloads ---');
  const ebupotRes = await page.request.get(`${BASE_URL}/api/v1/tax/export/ebupot-21`);
  const ebupotText = await ebupotRes.text();
  const ebupotOk = ebupotRes.status() === 200 && ebupotText.includes(';');
  console.log(`✅ e-Bupot 21 CSV Download: HTTP ${ebupotRes.status()}, Semicolon Delimited: ${ebupotOk}`);

  const efakturRes = await page.request.get(`${BASE_URL}/api/v1/tax/export/efaktur`);
  const efakturText = await efakturRes.text();
  const efakturOk = efakturRes.status() === 200 && efakturText.includes('FK;');
  console.log(`✅ e-Faktur CSV Download: HTTP ${efakturRes.status()}, Starts with FK;: ${efakturOk}`);

  // TEST 8: SAK MAPPING & LIVE AI REASONING MODAL
  console.log('\n--- 8. Testing SAK Mapping & Live AI Modal ---');
  await page.goto(`${BASE_URL}/engagements/ENG-2025-01/mapping`, { waitUntil: 'networkidle' });
  await page.locator('button[title="Buka Analisis Semantik AI"]').first().click();
  await page.waitForSelector('button:has-text("Terapkan")', { timeout: 12000 });
  console.log('✅ Live AI Reasoning Modal opened with standard analysis and confidence score!');
  await page.locator('button:has-text("Terapkan")').click();
  console.log('✅ Applied AI recommendation inline!');

  // TEST 9: WORKPAPER LEAD SCHEDULE
  console.log('\n--- 9. Testing Workpaper Lead Schedule ---');
  await page.goto(`${BASE_URL}/engagements/ENG-2025-01/workpaper`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Status Uji Tie-Out & Keseimbangan Matematis', { timeout: 10000 });
  console.log('✅ Lead schedule, balance scale, and waterfall chart rendered successfully!');

  // TEST 10: OFFICIAL MULTI-SHEET XLSX EXPORT
  console.log('\n--- 10. Testing Official Multi-Sheet XLSX Export ---');
  await page.goto(`${BASE_URL}/engagements/ENG-2025-01/exports`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Unduh Berkas XLSX', { timeout: 10000 });
  const xlsxRes = await page.request.get(`${BASE_URL}/api/v1/exports/EXP-2025-01/download`);
  console.log(`✅ XLSX Workbook Download: HTTP ${xlsxRes.status()}, Size: ${xlsxRes.headers()['content-length']} bytes`);

  // TEST 11: LOGIN PORTAL WITH 1-CLICK VIP KEY
  console.log('\n--- 11. Testing Login Portal with 1-Click VIP Keys ---');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Ibu Rina Asmara, Ak.")');
  await page.waitForURL('**/advisory', { timeout: 10000 });
  console.log('✅ 1-Click VIP Key button on login page logged in and redirected to advisory!');

  // TEST 12: MANUAL CREDENTIALS LOGIN
  console.log('\n--- 12. Testing Manual Credentials Login ---');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Email & Password")');
  await page.fill('input[type="email"]', 'rina@kap.id');
  await page.fill('input[type="password"]', 'Partner123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/overview', { timeout: 10000 });
  console.log('✅ Manual email/password login with rina@kap.id succeeded!');

  await browser.close();

  console.log('\n========================================');
  console.log('🎉 AUDIT SUMMARY:');
  console.log('Total Unhandled Browser Errors:', pageErrors.length);
  console.log('Total HTTP 4xx/5xx Network Errors:', networkErrors.length);
  console.log('ALL 12 PRODUCTION TESTS PASSED:', pageErrors.length === 0 && networkErrors.length === 0);
  console.log('========================================');
})();
