const fs = require('fs');
const output = fs.createWriteStream('./stdout.log', { flags: 'a' });
const errorOutput = fs.createWriteStream('./stderr.log', { flags: 'a' });
const logger = new console.Console({ stdout: output, stderr: errorOutput });
const today = new Date();

module.exports.log = function (message) {
  logger.log(`${today}: ${message}`);
};

module.exports.error = function (message) {
  logger.error(`${today}: ${message}`);
};
