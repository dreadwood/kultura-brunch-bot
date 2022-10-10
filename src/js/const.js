'use strict';

module.exports.SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
module.exports.CREDENTIALS_FILE = 'credentials.json';

module.exports.OrderStatus = {
  WELCOME: 'WELCOME', // select event
  EVENT: 'EVENT',
  TICKET: 'TICKET',
  NAME: 'NAME',
  PHONE: 'PHONE',
  PAYMENT: 'PAYMENT', // payment request
  CHECK: 'CHECK', // receipt check
  DONE: 'DONE',
};
