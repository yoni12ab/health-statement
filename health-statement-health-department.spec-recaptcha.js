//const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-extra');
require('dotenv').config();
const { sendEmail } = require('./mail');

const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.RE_CAPTCH_TOKEN, // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);

puppeteer.use(StealthPlugin());

(async () => {
  // const args = [
  //   '--no-sandbox',
  //   '--disable-setuid-sandbox',
  //   '--disable-infobars',
  //   '--window-position=0,0',
  //   '--ignore-certifcate-errors',
  //   '--ignore-certifcate-errors-spki-list',
  //   '--window-size=1000,1000',
  //   '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
  // ];

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
  await page.goto(
    'https://parents.education.gov.il/prhnet/parents/rights-obligations-regulations/health-statement-kindergarden?utm_source=sms&amp;utm_medium=txmsg_healthstatementkindergarden&amp;utm_campaign=portalhorim_general'
    // 'https://lgn.edu.gov.il/nidp/wsfed/ep?id=EduCombinedAuthUidPwd&sid=0&option=credential&sid=0'
  );
  //await page.waitForNavigation();

  await page.waitFor(10000);
  await (await page.$('[value*="מילוי הצהרת בריאות מקוונת"]')).click();
  await page.waitFor(10000);

  await page.click('#blocker');
  await page.waitFor(10000);
  await (await page.$('input[title="קוד משתמש"]')).type(
    process.env.HEALTH_DEPARTMENT_USER
  );
  await (await page.$('input[title="סיסמה"]')).type(
    process.env.HEALTH_DEPARTMENT_PASS
  );

  const cap = await page.solveRecaptchas();
  console.log(cap);
  await (await page.$('.user-pass-submit')).click();
  await page.waitFor(5000);
  return;
  let list = await page.$$('[value*="מילוי הצהרת בריאות"]');
  const length = list.length;
  for (let i = 0; i < length; i++) {
    await (await page.$('[value*="מילוי הצהרת בריאות"]')).click();
    await page.waitFor(4000);
    await (await page.$('[value="אישור"]')).focus(); //.click();
    await page.waitFor(6000);
  }

  await page.evaluate(() => {
    document.documentElement.scrollTop = 0;
  });
  const subject = 'הצהרת בריאות משרד הבריאות' + new Date().toDateString();
  const message = 'הצהרה נשלחה';
  const base64 = await page.screenshot({ encoding: 'base64' });

  await sendEmail(subject, message, base64, 'משרד הבריאות');

  await browser.close();
})();
