const puppeteer = require('puppeteer');
const { sendEmail } = require('./mail');
require('dotenv').config();

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });
  const page = await browser.newPage();
  page.on('dialog', (dialog) => {
    dialog.accept();
  });
  await page.goto('https://www.webtop.co.il/v2/?');
  await (await page.$('#identityNumber')).type(process.env.SMART_SCHOOL_USER);
  await (await page.$('#password')).type(process.env.SMART_SCHOOL_PASS);
  await (await page.$('#loginLogoutButton')).click();
  await page.waitFor(5000);
  await (await page.$('.drsMoveHandle')).click({ clickCount: 2 });

  await page.waitFor(5000);
  const elementHandle = await page.$('.drsElement .innerContent iframe');
  const frame = await elementHandle.contentFrame();
  await (await frame.$(`#saveButton`)).click();
  await page.waitFor(2000);

  const subject = 'הצהרת בריאות סמארט סקול' + new Date().toDateString();
  const message = 'הצהרה נשלחה';
  const base64 = await page.screenshot({ encoding: 'base64' });

  await sendEmail(subject, message, base64, 'סמארט סקול');
  await browser.close();
})();
