const puppeteer = require('puppeteer');
require('dotenv').config();
const { sendEmail } = require('./mail');
(async () => {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
  ];

  const browser = await puppeteer.launch({
    args,
    headless: false,
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
  await (await page.$('#HIN_USERID')).type(process.env.HEALTH_DEPARTMENT_USER);
  await (await page.$('#Ecom_Password')).type(
    process.env.HEALTH_DEPARTMENT_PASS
  );
  await (await page.$('.user-pass-submit')).click();
  await page.waitFor(5000);

  let list = await page.$$('[value*="מילוי הצהרת בריאות"]');

  for (const button of list) {
    await button.click();
    await page.waitFor(4000);
    await (await page.$('[value="אישור"]')).click();
    await page.waitFor(6000);
  }

  const subject = 'הצהרת בריאות משרד הבריאות' + new Date().toDateString();
  const message = 'הצהרה נשלחה';
  const base64 = await page.screenshot({ encoding: 'base64' });

  await sendEmail(subject, message, base64, 'משרד הבריאות');

  await browser.close();
})();
