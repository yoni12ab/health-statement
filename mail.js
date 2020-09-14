const nodemailer = require('nodemailer');

let transport = nodemailer.createTransport({});

const messageDefault = {
  from: 'yoni12ab@gmail.com',
  to: 'yoni12ab@gmail.com',
};

export function sendEmail(subject, html, imageBase64, imageFileName) {
  return new Promise((success) => {
    transport.sendMail(
      getMessage(subject, html, imageBase64, imageFileName),
      (err, info) => {
        success(err || info);
      }
    );
  });
}

function getMessage(subject, html, imageBase64, imageFileName) {
  return {
    from: 'yoni12ab@gmail.com',
    to: 'yoni12ab@gmail.com',
    subject,
    html,
    attachments: [
      {
        filename: imageFileName,
        content: imageBase64.split('base64,')[1],
        encoding: 'base64',
      },
    ],
  };
}
