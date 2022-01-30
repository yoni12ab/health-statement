const puppeteer = require('puppeteer');
require('dotenv').config();
const { sendEmail } = require('./mail');
async function scrollTop(page) {
  await page.evaluate(() => {
    document.body.scrollIntoView();
  });
}
async function sendMailWithPicture(page, subject, message) {
  await scrollTop(page);
  const base64 = await page.screenshot({ encoding: 'base64' });

  await sendEmail(subject, message, base64, 'משרד הבריאות');
}

async function isElementExists(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

(async () => {
  const browser = await puppeteer.launch({
    args: [
      '--start-maximized',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
    headless: false,
    executablePath:
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  });
  const page = await browser.newPage();
  page.on('dialog', (dialog) => {
    dialog.accept();
  });

  page.on('error', (err) => {
    sendMailWithPicture(
      page,
      'ERROR הצהרת בריאות משרד הבריאות' + new Date().toDateString(),
      err
    );
  });

  page.on('pageerror', (err) => {
    sendMailWithPicture(
      page,
      'ERROR הצהרת בריאות משרד הבריאות' + new Date().toDateString(),
      err
    );
  });

  try {
    await page.goto(
      'https://parents.education.gov.il/prhnet/parents/rights-obligations-regulations/health-statement-kindergarden?utm_source=sms&amp;utm_medium=txmsg_healthstatementkindergarden&amp;utm_campaign=portalhorim_general'
    );

    await page.waitFor(5000);
    await (await page.$('[value*="מילוי הצהרת בריאות מקוונת"]')).click();
    await page.waitFor(5000);

    await page.click('#blocker');
    await page.waitFor(2000);
    await (await page.$('input[title="קוד משתמש"]')).type(
      process.env.HEALTH_DEPARTMENT_USER
    );
    await (await page.$('input[title="סיסמה"]')).type(
      process.env.HEALTH_DEPARTMENT_PASS
    );
    await page.waitFor(3000);
    await (await page.$('.user-pass-submit')).click();
    await page.waitFor(5000);

    const kidsIds = await page.evaluate(() =>
      [...document.querySelectorAll('.row.kid-container')].map((s) => s.id)
    );
    console.log(kidsIds);
    for (const kidId of kidsIds) {
      if (!(await isElementExists(page, `[id="${kidId}"] .fa-chevron-left`))) {
        continue;
      }
      await page.click(`[id="${kidId}"] .fa-chevron-left`);
      await page.waitFor(4000);
      if (await isElementExists(page, `[id="${kidId}"]  [value="אישור"]`)) {
        console.log(`[id="${kidId}"]  [value="אישור"] exists`);
        await page.click(`[id="${kidId}"]  [value="אישור"]`);
        await page.waitFor(4000);
      }
      if (await isElementExists(page, `[id="${kidId}"]  [value="סגירה"]`)) {
        await page.click(`[id="${kidId}"]  [value="סגירה"]`);
      }
    }

    const subject = 'הצהרת בריאות משרד הבריאות' + new Date().toDateString();
    const message = 'הצהרה נשלחה';
    await sendMailWithPicture(page, subject, message);
  } catch (error) {
    console.error(error);
    await sendMailWithPicture(
      page,
      'ERROR הצהרת בריאות משרד הבריאות' + new Date().toDateString(),
      error
    );
  }
  await browser.close();
})();
