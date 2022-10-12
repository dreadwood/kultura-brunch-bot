'use strict';

module.exports.SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
module.exports.CREDENTIALS_FILE = 'credentials.json';
module.exports.FEEDBACK = '@dreadwood';
module.exports.ACOUNT_NAME = 'Bykov Sergei';

module.exports.OrderStatus = {
  WELCOME: 'WELCOME', // select event
  LIST: 'LIST',
  EVENT: 'EVENT',
  TICKET: 'TICKET',
  NAME: 'NAME',
  PHONE: 'PHONE',
  PAYMENT: 'PAYMENT', // payment request
  CHECK: 'CHECK', // receipt check
  DONE: 'DONE',
};

module.exports.ChanelCommands = {
  NOTICE: 'notice',
  CONFIRM: 'confirm',
  REPORT: 'report',
};

module.exports.UserCommands = {
  RESET: 'reset',
};
