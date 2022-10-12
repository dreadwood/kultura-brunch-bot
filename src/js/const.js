'use strict';

module.exports.SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
module.exports.CREDENTIALS_FILE = 'credentials.json';
module.exports.FEEDBACK = '@ellyprohorova';
module.exports.ACOUNT_NAME = 'Bykov Sergei';
module.exports.REG_EXP_PHONE = /^[\d\s\-()+]+$/;

module.exports.OrderStatus = {
  WELCOME: 'WELCOME', // initional state
  LIST: 'LIST', // event selection
  EVENT: 'EVENT', // event info
  TICKET: 'TICKET', // choosing tickets
  NAME: 'NAME', // name input
  PHONE: 'PHONE', // phone input
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
