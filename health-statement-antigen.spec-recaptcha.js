//const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-extra');
require('dotenv').config();
const { sendEmail } = require('./mail');
const logger = require('./logger');

const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const NUMBER_OF_KIDS = 10;
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.RE_CAPTCH_TOKEN, // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);

(async () => {
  logger.log('start running');
  const browser = await puppeteer.launch({
    args: [
      '--start-maximized',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      'de',
    ],
    devtools: true,
    headless: false,
    executablePath:
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  });
  const page = await browser.newPage();
  page.on('dialog', (dialog) => {
    dialog.accept();
  });
  await page.goto('https://apps.education.gov.il/NmmNetAnt/Antigen');
  await page.waitFor(3000);
  try {
    if (!needsToRun()) {
      logger.error('Not need to run today');
      return;
      //throw new Error('Not need to run today');
    }

    logger.log('Fill parent details');
    await fillParent(page);

    logger.log('Fill kids details');
    await fillKids(page);

    logger.log('Solving Recaptchas');
    const cap = await page.solveRecaptchas();

    logger.log('Click send button');
    await (await page.$(`#cmdSend`)).click();
    await page.waitFor(3000);

    logger.log(`Sending success mail`);
    await sendEmailWithScreenshot(browser, page, cap.error);

    logger.log('Done');
  } catch (error) {
    logger.error(error);
    await sendEmailWithScreenshot(browser, page, error);
  }

  return;
})();

async function scrollDown(page) {
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
  });
}

async function fillParent(page) {
  await (await page.$('#txtMisparZehutHore')).type(
    process.env.ANTIGEN_PARENT_ID
  );

  await (await page.$('#txtShemPratiHore')).type(
    process.env.ANTIGEN_PARENT_NAME
  );
}

async function fillKids(page) {
  for (let i = 1; i < NUMBER_OF_KIDS; i++) {
    await scrollDown(page);
    const kidName = process.env[`ANTIGEN_KID_NAME_${i}`];
    const kidID = process.env[`ANTIGEN_KID_ID_${i}`];

    console.log(`fill kid details ${i} ${kidID} ${kidName}`);

    const rowPrefixSelector = `.child-row:nth-child(${i})`;
    await (await page.$(`${rowPrefixSelector} .mispar-zehut-yeled`)).type(
      kidID
    );

    await (await page.$(`${rowPrefixSelector} .shem-prati-yeled`)).type(
      kidName
    );

    await (await page.$(`${rowPrefixSelector} .form-check-input`)).click();

    await page.waitFor(1000);

    await scrollDown(page);

    const nextKid = process.env[`ANTIGEN_KID_NAME_${i + 1}`];
    if (!nextKid) {
      break;
    }

    await (await page.$(`#cmdAdd`)).click();
  }
}

async function sendEmailWithScreenshot(browser, page, error) {
  await page.evaluate(() => {
    document.documentElement.scrollTop = 0;
  });
  const subject = 'הצהרת בריאות אנטיגן' + new Date().toDateString();
  const message = error ? 'ההצהרה לא נשלחה' : 'הצהרה נשלחה';
  const base64 = await page.screenshot({ encoding: 'base64' });

  await sendEmail(subject, message, base64, 'משרד הבריאות');

  await browser.close();
}

function needsToRun() {
  const day = new Date().getDay() + 1;
  const daysToRunIn = [1, 4]; // run only on Sunday or Wednesday
  return daysToRunIn.includes(day);
}
