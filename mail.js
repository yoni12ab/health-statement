const nodemailer = require('nodemailer');
require('dotenv').config();
const transport = nodemailer.createTransport({
  host: process.env.MAIL_SMTP_SERVER,
  port: process.env.MAIL_SMTP_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

module.exports.sendEmail = function (
  subject,
  html,
  imageBase64,
  imageFileName
) {
  return new Promise((success) => {
    transport.sendMail(
      getMessage(subject, html, imageBase64, imageFileName),
      (err, info) => {
        if (err) {
          console.log(err.message.substring(0, 30));
        } else {
          console.log('success');
        }

        success(err || info);
      }
    );
  });
};

function getMessage(subject, html, imageBase64, imageFileName) {
  const message = {
    from: 'yoni12ab@gmail.com',
    to: 'yoni12ab@gmail.com',
    subject,
    html: `${html} <br/>`,
  };
  if (imageBase64) {
    //console.log(imageBase64);
    message.attachments = [
      {
        filename: imageFileName + '.jpg',
        content: imageBase64,
        encoding: 'base64',
      },
    ];
  }
  return message;
}
