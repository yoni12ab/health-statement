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
  // const elementHandle = await page.$('.innerContent iframe');
  // const frame = await elementHandle.contentFrame();
  // for (let i = 0; i < 2; i++) {
  //   await (await frame.$(`[for*="studentIDs_${i}"] a`)).click();
  //   await page.waitFor(2000);
  //   await (await frame.$('[src*="email.gif"]')).click();
  //   await page.waitFor(2000);
  // }
  const elementHandle = await page.$('.drsElement .innerContent iframe');
  const frame = await elementHandle.contentFrame();
  await (await frame.$(`#saveButton`)).click();
  await page.waitFor(2000);
  // await (await frame.$('[src*="email.gif"]')).click();
  // await page.waitFor(2000);
  const subject = 'הצהרת בריאות' + new Date().toDateString();
  const message = 'הצהרה נשלחה';
  const base64 = await page.screenshot({ encoding: 'base64' });
  await sendEmail(subject, message, base64, 'image.jpg');
  await browser.close();
})();
