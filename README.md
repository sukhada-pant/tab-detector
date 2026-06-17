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

Pass the page you want to test right after the command:

\`\`\`bash
npm run scan -- https://example.com
\`\`\`

If you don't pass a URL, it scans the default page set in \`scan.js\`.

After it runs, open \`report.html\` in your browser to see the results.

## Trying the built-in trap example

A deliberately broken page (\`trapped.html\`) is included so you can see the
detector catch a real keyboard trap.

1. In one terminal, serve the file locally: \`npx serve\`
2. In another terminal, run it against the served page:

\`\`\`bash
npm run scan -- http://localhost:3000/trapped.html
\`\`\`

The report should show **FAIL** with a keyboard trap detected.

## Notes & limitations

- Some live sites block automated browsers (bot/CAPTCHA walls). Run this on
  pages you own or have permission to test.
- Trap detection is heuristic (flags focus looping). Escape-key and Shift+Tab
  checks are planned next.