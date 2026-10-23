// npm run report:pdf: renders output/report/solution_report.html to output/OnboardIQ_Solution_Report.pdf with the
// Chrome installed on the machine (A4, page numbers in the footer).
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const browser = await chromium.launch({
  channel: process.env.E2E_BROWSER === 'chromium' ? undefined : 'chrome',
});
const page = await browser.newPage();
await page.goto(`file://${root}output/report/solution_report.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: `${root}output/OnboardIQ_Solution_Report.pdf`,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate:
    '<div style="width:100%;font-size:7.5px;color:#5f5c55;padding:0 14mm;display:flex;justify-content:space-between;font-family:Helvetica,Arial,sans-serif"><span>OnboardIQ · Solution report · HCLTech BFSI Challenge, Use Case 02</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
});
await browser.close();
console.log('Wrote output/OnboardIQ_Solution_Report.pdf');
