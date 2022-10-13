'use strict';

module.exports.SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
module.exports.CREDENTIALS_FILE = 'credentials.json';

module.exports.LOG_FILE = 'bot.log';
module.exports.DEFAULT_LOG_LEVEL = 'info';

module.exports.TIME_SESSION = 600000;
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
};

module.exports.ChanelCommands = {
  NOTICE: 'notice',
  CONFIRM: 'confirm',
  REPORT: 'report',
};

module.exports.UserCommands = {
  RESET: 'reset',
  RETURN_POLICY: 'returnPolicy',
};

module.exports.BotCommands = {
  START: {
    command: 'start',
    description: 'Выбрать мероприятие',
  },
};

module.exports.Pages = {
  EVENTS: 'Мероприятия',
  CLIENTS: 'Заказы',
};

module.exports.Env = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
};
