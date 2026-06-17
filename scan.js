const fs = require('fs'); // built-in tool for saving files
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

async function run() {
  const URL = process.argv[2] || 'https://www.axelerant.com/';

  // Open a visible browser window so you can watch it work.
  const browser = await chromium.launch({ headless: false });

  // Create a context explicitly (axe-core needs this), then a page (tab).
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Opening page...');
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // ---------- PART 1: axe-core accessibility scan ----------
  console.log('\nRunning axe-core...');
  const axeResults = await new AxeBuilder({ page }).analyze();

  console.log(`axe found ${axeResults.violations.length} types of issues:`);
  for (const v of axeResults.violations) {
    console.log(`  - [${v.impact}] ${v.id}: ${v.nodes.length} element(s)`);
  }

  // ---------- PART 2: your Tab-walker (keyboard-trap check) ----------
  console.log('\nWalking focus with Tab...');
  const seen = new Set();
  const steps = [];
  let trapped = false;

  for (let i = 1; i <= 40; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { atBody: true };
      const box = el.getBoundingClientRect();
      return {
        atBody: false,
        tag: el.tagName,
        role: el.getAttribute('role'),
        name: (el.getAttribute('aria-label') ||
               el.textContent.trim()).slice(0, 40),
        sig: el.tagName + '|' + (el.id || el.className) + '|' +
             Math.round(box.x) + ',' + Math.round(box.y)
      };
    });

    if (info.atBody) {
      console.log(`  Tab ${i}: focus left to page body (escaped).`);
      break;
    }

    const revisit = seen.has(info.sig);
    seen.add(info.sig);
    steps.push({ step: i, ...info, revisit });

    console.log(`  Tab ${i}: <${info.tag}> "${info.name}"` +
                (revisit ? '   <-- REVISIT (possible trap)' : ''));

    const recent = steps.slice(-6);
    if (recent.length === 6 && recent.filter(s => s.revisit).length >= 4) {
      trapped = true;
      console.log('  --> Looks like a KEYBOARD TRAP: focus keeps looping.');
      break;
    }
  }

  // ---------- Combined verdict ----------

  const verdict = trapped ? 'FAIL' : 'PASS';
  console.log('\n===== SUMMARY =====');
  console.log(`axe-core issues: ${axeResults.violations.length}`);
  console.log(`Keyboard trap detected: ${trapped ? 'YES (FAIL)' : 'no'}`);

  // Gather everything into one tidy object.
  const report = {
    url: URL,
    scannedAt: new Date().toISOString(), // timestamp of this run
    verdict: verdict,
    keyboardTrap: trapped,
    axeIssues: axeResults.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      elements: v.nodes.length
    })),
    focusSteps: steps
  };

  // ----- Save the JSON file -----
  fs.writeFileSync('report.json', JSON.stringify(report, null, 2));
  console.log('\nSaved report.json');

  // ----- Build and save the HTML file -----
  const axeRows = report.axeIssues.map(issue =>
    `<tr><td>${issue.impact}</td><td>${issue.id}</td><td>${issue.elements}</td></tr>`
  ).join('');

  const stepRows = report.focusSteps.map(s =>
    `<tr class="${s.revisit ? 'revisit' : ''}">
       <td>${s.step}</td><td>${s.tag || ''}</td>
       <td>${(s.name || '').replace(/</g, '&lt;')}</td>
       <td>${s.revisit ? 'REVISIT' : ''}</td>
     </tr>`
  ).join('');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Scan report</title>
<style>
  body { font-family: sans-serif; padding: 30px; }
  .verdict { display:inline-block; padding:6px 16px; border-radius:6px;
             color:#fff; font-weight:bold; }
  .PASS { background:#2f9e44; } .FAIL { background:#e03131; }
  table { border-collapse: collapse; margin-top: 12px; }
  td, th { border: 1px solid #ccc; padding: 6px 10px; text-align:left; }
  tr.revisit { background: #fff4e6; }
</style></head>
<body>
  <h1>Keyboard & Accessibility Report</h1>
  <p>Page: ${report.url}</p>
  <p>Scanned: ${report.scannedAt}</p>
  <p>Verdict: <span class="verdict ${verdict}">${verdict}</span></p>

  <h2>axe-core issues (${report.axeIssues.length})</h2>
  <table>
    <tr><th>Impact</th><th>Issue</th><th>Elements</th></tr>
    ${axeRows}
  </table>

  <h2>Focus path (${report.focusSteps.length} steps)</h2>
  <table>
    <tr><th>#</th><th>Tag</th><th>Name</th><th>Note</th></tr>
    ${stepRows}
  </table>
</body></html>`;

  fs.writeFileSync('report.html', html);
  console.log('Saved report.html');

  await browser.close();
}

run();