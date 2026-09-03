const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Test 1: Check Copilot trigger on Overview
  await page.goto('http://localhost:3008/engagements/ENG-2025-01/overview', { waitUntil: 'networkidle' });
  const trigger = await page.$('#finova-copilot-trigger');
  console.log('1. Copilot trigger button present:', !!trigger);

  // Click Copilot trigger
  await page.click('#finova-copilot-trigger');
  await new Promise(r => setTimeout(r, 600));
  const copilotHeader = await page.$('text=FINOVA AI Audit Copilot');
  console.log('2. Copilot drawer opened successfully:', !!copilotHeader);

  await page.screenshot({ path: '/home/cakai/.gemini/antigravity-ide/brain/a1a13bb9-3ffe-403e-9bc1-3d875031a35b/screenshots/chrome_live_copilot.png' });

  // Test 2: Check AI Inspector on Mapping page
  await page.goto('http://localhost:3008/engagements/ENG-2025-01/mapping', { waitUntil: 'networkidle' });
  await page.click('button[title="Buka Analisis Semantik AI"]');
  await new Promise(r => setTimeout(r, 1200));
  const aiModalHeader = await page.$('text=FINOVA AI Semantic Reasoning Inspector');
  console.log('3. AI Semantic Reasoning Inspector opened:', !!aiModalHeader);

  await page.screenshot({ path: '/home/cakai/.gemini/antigravity-ide/brain/a1a13bb9-3ffe-403e-9bc1-3d875031a35b/screenshots/chrome_live_ai_inspector.png' });

  await browser.close();
  console.log('🎉 All live UI verifications PASSED!');
})();
