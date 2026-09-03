const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const VIDEO_DIR = '/home/cakai/.gemini/antigravity-ide/brain/a1a13bb9-3ffe-403e-9bc1-3d875031a35b/videos';
const BRAIN_DIR = '/home/cakai/.gemini/antigravity-ide/brain/a1a13bb9-3ffe-403e-9bc1-3d875031a35b';
const BASE_URL = 'http://localhost:3008';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function smoothScroll(page, targetY, durationMs = 600) {
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
  await sleep(durationMs + 80);
}

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
    cursor.style.backgroundColor = 'rgba(15, 143, 122, 0.9)';
    cursor.style.border = '2.5px solid #FFFFFF';
    cursor.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
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
        cursor.style.backgroundColor = 'rgba(15, 143, 122, 0.9)';
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 180);
    };
  });
}

async function setExplainer(page, { chapter, title, desc, badges = [], progress = 0 }) {
  await page.evaluate(({ chapter, title, desc, badges, progress }) => {
    let hud = document.getElementById('finova-explainer-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'finova-explainer-hud';
      hud.style.position = 'fixed';
      hud.style.bottom = '20px';
      hud.style.left = '50%';
      hud.style.transform = 'translateX(-50%)';
      hud.style.width = '900px';
      hud.style.maxWidth = '92vw';
      hud.style.backgroundColor = 'rgba(16, 42, 50, 0.94)';
      hud.style.backdropFilter = 'blur(16px)';
      hud.style.webkitBackdropFilter = 'blur(16px)';
      hud.style.border = '1.5px solid rgba(15, 143, 122, 0.45)';
      hud.style.borderRadius = '16px';
      hud.style.padding = '12px 20px';
      hud.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.45)';
      hud.style.zIndex = '999998';
      hud.style.color = '#ffffff';
      hud.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      hud.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      hud.style.pointerEvents = 'none';

      hud.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span id="hud-chapter" style="font-size: 10px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; background: #0F8F7A; color: white; padding: 2px 8px; border-radius: 6px;"></span>
            <h4 id="hud-title" style="margin: 0; font-size: 13.5px; font-weight: 700; color: #FFFFFF;"></h4>
          </div>
          <div id="hud-badges" style="display: flex; gap: 6px;"></div>
        </div>
        <p id="hud-desc" style="margin: 0; font-size: 11px; color: #B2DFD6; line-height: 1.4;"></p>
        <div style="margin-top: 6px; height: 3px; width: 100%; background: rgba(255,255,255,0.15); border-radius: 99px; overflow: hidden;">
          <div id="hud-progress" style="height: 100%; width: 0%; background: linear-gradient(90deg, #0F8F7A, #38BDF8); transition: width 0.4s ease;"></div>
        </div>
      `;
      document.body.appendChild(hud);
    }

    document.getElementById('hud-chapter').innerText = chapter;
    document.getElementById('hud-title').innerText = title;
    document.getElementById('hud-desc').innerText = desc;
    document.getElementById('hud-progress').style.width = `${progress}%`;

    const badgesContainer = document.getElementById('hud-badges');
    badgesContainer.innerHTML = badges.map(b => 
      `<span style="font-size: 9px; font-weight: 700; font-family: monospace; background: rgba(255,255,255,0.12); color: #E8F5F1; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.18);">${b}</span>`
    ).join('');
  }, { chapter, title, desc, badges, progress });
}

async function moveMouseToElement(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 6000 });
    const el = await page.$(selector);
    if (!el) return null;
    const box = await el.boundingBox();
    if (box) {
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.evaluate(({ x, y }) => {
        if (window.moveCursor) window.moveCursor(x, y);
      }, { x, y });
      await page.mouse.move(x, y, { steps: 6 });
      return box;
    }
  } catch (e) {
    console.log(`Could not move to: ${selector}`);
  }
  return null;
}

async function clickElement(page, selector) {
  await moveMouseToElement(page, selector);
  await sleep(150);
  await page.evaluate(() => { if (window.clickCursor) window.clickCursor(); });
  await page.click(selector);
  await sleep(300);
}

(async () => {
  console.log('🎬 Starting Master End-to-End Explainer Video Recording...');
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
  let videoPath = null;

  try {
    // -------------------------------------------------------------
    // SCENE 1: LANDING PAGE RESMI
    // -------------------------------------------------------------
    console.log('📍 Scene 1: Landing Page Resmi');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await injectCursor(page);
    await setExplainer(page, {
      chapter: 'Tahap 1 dari 12',
      title: 'Portal Landing Page Resmi FINOVA AI',
      desc: 'Platform audit akuntansi, kepatuhan pajak terintegrasi, dan kecerdasan analitik konsultan berstandar SAK Indonesia.',
      badges: ['SAK INDONESIA', 'TURBOPACK', 'PORT 3008'],
      progress: 8,
    });
    await sleep(1800);

    await clickElement(page, 'button:has-text("AI Reasoning")');
    await sleep(1200);

    await clickElement(page, 'button:has-text("Waterfall Laba")');
    await sleep(1200);

    await clickElement(page, 'a:has-text("Mulai Onboarding Kantor KAP")');
    await page.waitForURL('**/onboarding', { timeout: 6000 });

    // -------------------------------------------------------------
    // SCENE 2: ONBOARDING WIZARD 4-LANGKAH
    // -------------------------------------------------------------
    console.log('📍 Scene 2: Onboarding Wizard 4-Langkah');
    await injectCursor(page);
    await setExplainer(page, {
      chapter: 'Tahap 2 dari 12',
      title: 'Setup Identitas Kantor Akuntan Publik (KAP)',
      desc: 'Mendaftarkan Izin Usaha KMK No. 492/KM.1/2024 dan Akuntan Publik Penanggung Jawab (AP.0942) langsung ke SQLite ACID.',
      badges: ['KAP HAIDAR & REKAN', 'KMK RESMI', 'AP.0942'],
      progress: 16,
    });
    await sleep(1500);

    await clickElement(page, 'button:has-text("Lanjut: Tim & Penandatangan")');
    await sleep(1000);

    await clickElement(page, 'button:has-text("Lanjut: Standar Audit")');
    await sleep(1000);

    await clickElement(page, 'button:has-text("Lanjut: Konfirmasi & Peluncuran")');
    await sleep(1500);

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    // -------------------------------------------------------------
    // SCENE 3: ENTERPRISE LOGIN PORTAL
    // -------------------------------------------------------------
    console.log('📍 Scene 3: Enterprise Login Portal');
    await injectCursor(page);
    await setExplainer(page, {
      chapter: 'Tahap 3 dari 12',
      title: 'Otentikasi Kredensial Bcrypt & Keamanan Sesi',
      desc: 'Proteksi rute otomatis dengan middleware JWT dan verifikasi kata sandi Bcrypt terenkripsi aman.',
      badges: ['BCRYPT SALT-10', 'HTTPONLY JWT', 'RBAC MULTI-ROLE'],
      progress: 25,
    });
    await sleep(1500);

    // 1-Click Quick Demo Login for Partner
    await clickElement(page, 'button:has-text("Haidar, CPA, CA")');
    await page.waitForURL('**/overview', { timeout: 8000 });

    // -------------------------------------------------------------
    // SCENE 4: DIREKTORI PERIKATAN
    // -------------------------------------------------------------
    console.log('📍 Scene 4: Direktori Perikatan');
    await page.goto(`${BASE_URL}/engagements`, { waitUntil: 'networkidle' });
    await injectCursor(page);
    await setExplainer(page, {
      chapter: 'Tahap 4 dari 12',
      title: 'Direktori Perikatan Aktif & Pemilihan Klien',
      desc: 'Memilih perikatan audit PT Nusantara Sukses Makmur (Tahun Fiskal 2025) dengan materialitas Rp 250 Juta.',
      badges: ['ENG-2025-01', 'PT NUSANTARA', 'MATERIALITAS 250JT'],
      progress: 33,
    });
    await sleep(1500);

    // Click "Buka Perikatan" Link
    await clickElement(page, 'a[href*="/overview"]');
    await page.waitForURL('**/overview', { timeout: 6000 });

    // -------------------------------------------------------------
    // SCENE 5: OVERVIEW & MULTI-PERIOD SELECTOR
    // -------------------------------------------------------------
    console.log('📍 Scene 5: Overview & Multi-Period Selector');
    await injectCursor(page);
    await setExplainer(page, {
      chapter: 'Tahap 5 dari 12',
      title: 'Persamaan Neraca & Pemilih Siklus Multi-Periode',
      desc: 'Persamaan fundamental Aset (Rp 34,55 M) = Liabilitas + Ekuitas seimbang sempurna, dengan filter Triwulanan & Semesteran.',
      badges: ['A = L + E PASS', 'TIE-OUT KLOP', 'MULTI-CYCLE'],
      progress: 42,
    });
    await sleep(1200);

    // Multi-Period cycle switchers
    await clickElement(page, 'button:has-text("Triwulan 4")');
    await sleep(800);
    await clickElement(page, 'button:has-text("Tahunan")');
    await sleep(800);

    await smoothScroll(page, 320, 500);
    await sleep(1200);

    // -------------------------------------------------------------
    // SCENE 6: BERKAS SUMBER & HASH SHA-256
    // -------------------------------------------------------------
    console.log('📍 Scene 6: Berkas Sumber & Hash SHA-256');
    await smoothScroll(page, 0, 300);
    await clickElement(page, 'nav a[href$="/files"]');
    await page.waitForURL('**/files', { timeout: 6000 });
    await injectCursor(page);
    await setExplainer(page, {
      chapter: 'Tahap 6 dari 12',
      title: 'Validasi Kriptografis Berkas Sumber Excel',
      desc: 'Integritas file trial balance diuji dengan SHA-256 hash checksum anti-tamper untuk memenuhi standar bukti audit.',
      badges: ['SHA-256 CHECKSUM', 'MACRO-SCAN CLEAN', 'IMMUTABLE'],
      progress: 50,
    });
    await smoothScroll(page, 350, 500);
    await sleep(1500);

    // -------------------------------------------------------------
    // SCENE 7: PEMETAAN SAK & AI REASONING MODAL
    // -------------------------------------------------------------
    console.log('📍 Scene 7: Pemetaan SAK & AI Reasoning');
    await smoothScroll(page, 0, 300);
    await clickElement(page, 'nav a[href$="/mapping"]');
    await page.waitForURL('**/mapping', { timeout: 6000 });
    await injectCursor(page);
    await setExplainer(page, {
      chapter: 'Tahap 7 dari 12',
      title: 'Pemetaan Akun SAK & Live AI Reasoning (PSAK 10)',
      desc: 'Model Qwen 3.8 menganalisis perlakuan selisih kurs valuta asing dan memberikan justifikasi standar PSAK 10 transparan.',
      badges: ['QWEN 3.8 REASONING', 'PSAK 10', '100% MAPPED'],
      progress: 58,
    });
    await sleep(1200);

    // Open AI Inspector modal
    await clickElement(page, 'button[title="Buka Analisis Semantik AI"]');
    await page.waitForSelector('button:has-text("Terapkan")', { timeout: 12000 });
    await sleep(1500);

    // Apply recommendation
    await clickElement(page, 'button:has-text("Terapkan")');
    await sleep(1200);

    // -------------------------------------------------------------
    // SCENE 8: KERTAS KERJA LEAD SCHEDULE & WATERFALL
    // -------------------------------------------------------------
    console.log('📍 Scene 8: Lead Schedule & Waterfall');
    await clickElement(page, 'nav a[href$="/workpaper"]');
    await page.waitForURL('**/workpaper', { timeout: 6000 });
    await injectCursor(page);
    await setExplainer(page, {
      chapter: 'Tahap 8 dari 12',
      title: 'Lead Schedule & Visualisasi Jembatan Laba Bersih',
      desc: 'Dekomposisi Pendapatan Usaha hingga Laba Bersih Tahun Berjalan dengan spreadsheet interaktif dan sinkronisasi SQLite.',
      badges: ['LEAD SCHEDULE', 'FINANCIAL WATERFALL', 'INTERACTIVE GRID'],
      progress: 66,
    });
    await smoothScroll(page, 250, 500);
    await sleep(1500);
    await smoothScroll(page, 650, 500);
    await sleep(1500);

    // -------------------------------------------------------------
    // SCENE 9: ANALISIS KONSULTAN (ADVISORY HUB & WHAT'S NEXT)
    // -------------------------------------------------------------
    console.log('📍 Scene 9: Analisis Konsultan (Advisory Hub)');
    await smoothScroll(page, 0, 300);
    await clickElement(page, 'nav a[href$="/advisory"]');
    await page.waitForURL('**/advisory', { timeout: 6000 });
    await injectCursor(page);
    await setExplainer(page, {
      chapter: 'Tahap 9 dari 12',
      title: 'DNA Konsultan: "Biaya Membengkak? So What\'s Next?"',
      desc: 'Mendeteksi lonjakan beban logistik (+44.5%), mengurai akar masalah pengiriman, dan memberikan 3 tahap solusi hemat Rp 485 Juta.',
      badges: ['SOLUSI TANTE RINA', 'ROOT CAUSE', 'WHAT-IF SIMULATOR'],
      progress: 75,
    });
    await sleep(1800);

    // Sub-tab 2: Barometer Rasio
    await clickElement(page, 'button:has-text("2. Barometer Rasio")');
    await sleep(1400);

    // Sub-tab 3: Dekomposisi Manufaktur COGM
    await clickElement(page, 'button:has-text("3. Dekomposisi HPP Manufaktur")');
    await sleep(1400);

    // Sub-tab 4: What-If Sensitivity Simulator
    await clickElement(page, 'button:has-text("4. Simulasi Sensitivitas")');
    await sleep(2000);

    // -------------------------------------------------------------
    // SCENE 10: KEPATUHAN PAJAK (TAX HUB)
    // -------------------------------------------------------------
    console.log('📍 Scene 10: Kepatuhan Pajak (Tax Hub)');
    await smoothScroll(page, 0, 300);
    await clickElement(page, 'nav a[href$="/tax"]');
    await page.waitForURL('**/tax', { timeout: 6000 });
    await injectCursor(page);
    await setExplainer(page, {
      chapter: 'Tahap 10 dari 12',
      title: 'Pusat Kepatuhan Pajak (PPh 21 TER, PPN, & DJP CSV)',
      desc: 'Otomasi PPh 21 TER (PP 58/2023), Ekualisasi Omset PPN 1111 Klop 100%, Smart Payroll Importer, dan unduh CSV DJP.',
      badges: ['SOLUSI BUNDA', 'PP 58/2023 TER', 'EKUALISASI PPN 1111', 'CSV DJP READY'],
      progress: 83,
    });
    await sleep(1600);

    // Open Smart Payroll Importer panel
    await clickElement(page, 'button:has-text("Smart Payroll Importer")');
    await sleep(1500);

    // Switch sample client B
    await clickElement(page, 'button:has-text("File Klien B: Format Logistik")');
    await sleep(1400);

    // Switch to Sub-tab 2: Ekualisasi PPN
    await clickElement(page, 'button:has-text("2. Ekualisasi Omset SPT Masa PPN 1111")');
    await sleep(1500);

    // Switch to Sub-tab 3: Rekonsiliasi Fiskal PPh Badan
    await clickElement(page, 'button:has-text("3. Rekonsiliasi Fiskal PPh Badan")');
    await sleep(1500);

    // -------------------------------------------------------------
    // SCENE 11: EKSPOR RESMI XLSX & BUKTI VERIFIKASI
    // -------------------------------------------------------------
    console.log('📍 Scene 11: Ekspor Resmi XLSX');
    await smoothScroll(page, 0, 300);
    await clickElement(page, 'nav a[href$="/exports"]');
    await page.waitForURL('**/exports', { timeout: 6000 });
    await injectCursor(page);
    await setExplainer(page, {
      chapter: 'Tahap 11 dari 12',
      title: 'Ekspor Kertas Kerja Induk Resmi XLSX (Multi-Sheet)',
      desc: 'Pre-flight check lulus 100%, menghasilkan file XLSX resmi lengkap dengan cryptographic read-back verification.',
      badges: ['XLSX ENGINE', 'READ-BACK PASS', 'RESMI KAP'],
      progress: 92,
    });
    await smoothScroll(page, 350, 500);
    await sleep(1500);

    // -------------------------------------------------------------
    // SCENE 12: AUDIT COPILOT & LOGOUT
    // -------------------------------------------------------------
    console.log('📍 Scene 12: Audit Copilot & Logout');
    await smoothScroll(page, 0, 300);
    await setExplainer(page, {
      chapter: 'Tahap 12 dari 12',
      title: 'FINOVA Audit Copilot & Pengakhiran Sesi',
      desc: 'Asisten cerdas terintegrasi penuh memegang konteks perikatan, sesi berakhir dengan pencabutan token aman.',
      badges: ['LIVE ASSISTANT', 'SESSION REVOCATION', 'PRODUCTION READY'],
      progress: 100,
    });

    // Open Copilot Drawer
    await clickElement(page, 'button:has-text("Tanya FINOVA AI")');
    await sleep(2000);

    // Close Copilot
    await clickElement(page, 'button:has(svg.lucide-x)');
    await sleep(800);

    // Open Avatar menu & Logout
    await clickElement(page, 'header button:has(div.rounded-full)');
    await sleep(800);
    await clickElement(page, 'button:has-text("Keluar (Log Out)")');
    await page.waitForURL('**/login', { timeout: 6000 });
    await sleep(1500);

    console.log('🎉 12-Scene Master End-to-End Explainer Video Recording Completed!');
    videoPath = await page.video().path();
  } catch (err) {
    console.error('❌ Error during master showcase recording:', err);
  } finally {
    await context.close();
    await browser.close();

    if (videoPath && fs.existsSync(videoPath)) {
      console.log('🎥 Raw video saved at:', videoPath);
      const targetMp4 = path.join(VIDEO_DIR, 'finova_ai_full_e2e_showcase.mp4');
      const targetWebm = path.join(VIDEO_DIR, 'finova_ai_full_e2e_showcase.webm');
      const rootMp4 = path.join(BRAIN_DIR, 'finova_ai_full_e2e_showcase.mp4');
      const rootWebm = path.join(BRAIN_DIR, 'finova_ai_full_e2e_showcase.webm');
      const previewWebp = path.join(BRAIN_DIR, 'finova_ai_full_e2e_preview.webp');

      console.log('⚡ Converting to High-Quality H.264 MP4...');
      execSync(`ffmpeg -y -i "${videoPath}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p "${targetMp4}"`);
      execSync(`cp -f "${targetMp4}" "${rootMp4}"`);

      console.log('⚡ Converting to WebM...');
      execSync(`cp -f "${videoPath}" "${targetWebm}"`);
      execSync(`cp -f "${videoPath}" "${rootWebm}"`);

      console.log('⚡ Generating Animated WebP Preview for UI...');
      execSync(`ffmpeg -y -i "${targetMp4}" -vf "fps=10,scale=960:-1:flags=lanczos" -loop 0 -t 15 "${previewWebp}"`);

      console.log('✅ ALL VIDEO ARTIFACTS PROCESSED SUCCESSFULLY!');
    }
  }
})();
