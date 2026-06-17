# Keyboard-Trap & Accessibility Scanner

Runs two accessibility checks on a web page in one go:

1. **axe-core** — catches standard issues (contrast, missing alt text, labels, ARIA).
2. **A custom Tab-walker** — catches **keyboard traps** and focus problems that
   axe-core cannot detect, by pressing Tab through the page and watching whether
   focus ever gets stuck.

It outputs a JSON report (for records) and an HTML report (PASS/FAIL, readable).

## Why this exists

Automated scanners are blind to keyboard traps — where a keyboard or
screen-reader user tabs into a component (a modal, menu, filter form) and
cannot tab back out. This tool automates that manual check.

## Setup

Requires Node.js 18 or higher.

\`\`\`bash
npm install
npx playwright install chromium
\`\`\`

## Usage

1. Open \`scan.js\` and set the \`URL\` near the top to the page you want to test.
2. Run:

\`\`\`bash
npm run scan
\`\`\`

3. Open \`report.html\` in your browser to see the results.

## Trying the built-in trap example

A deliberately broken page (\`trapped.html\`) is included so you can see the
detector catch a real keyboard trap.

1. In one terminal, serve the file locally: \`npx serve\`
2. In \`scan.js\`, set \`URL\` to \`http://localhost:3000/trapped.html\`
3. Run \`npm run scan\` — the report should show **FAIL** with a keyboard trap.

## Notes & limitations

- Some live sites block automated browsers (bot/CAPTCHA walls). Run this on
  pages you own or have permission to test.
- Trap detection is heuristic (flags focus looping). Escape-key and Shift+Tab
  checks are planned next.