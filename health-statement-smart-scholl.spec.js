const puppeteer = require('puppeteer');
const { sendEmail } = require('./mail');
require('dotenv').config();

async function sendMailWithPicture(page, subject, message) {
  const base64 = await page.screenshot({ encoding: 'base64' });

  await sendEmail(subject, message, base64, 'סמארט סקול');
}
(async () => {
  let subject = '';
  let message = '';
  let page;
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
    });
    page = await browser.newPage();
    page.on('dialog', (dialog) => {
      dialog.accept();
    });
    page.on('error', (err) => {
      sendMailWithPicture(
        page,
        ' ERROR הצהרת בריאות סמארט סקול' + new Date().toDateString(),
        err
      );
    });

    page.on('pageerror', (err) => {
      sendMailWithPicture(
        page,
        ' ERROR הצהרת בריאות סמארט סקול' + new Date().toDateString(),
        err
      );
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

    subject = 'הצהרת בריאות סמארט סקול' + new Date().toDateString();
    message = 'הצהרה נשלחה';
  } catch (error) {
    console.log(error);
    subject = ' ERROR הצהרת בריאות סמארט סקול' + new Date().toDateString();
    message = 'הצהרה לא';
  }
  await sendMailWithPicture(page, subject, message);

  await browser.close();
})();
