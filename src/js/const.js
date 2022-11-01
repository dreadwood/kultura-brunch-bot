'use strict';

module.exports.SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

module.exports.LOG_FILE = 'bot.log';
module.exports.DEFAULT_LOG_LEVEL = 'info';
module.exports.RUS_LOCAL = 'ru-RU';

module.exports.TIME_SESSION = 600000;
module.exports.LENGTH_ORDER_ID = 6;
module.exports.REG_EXP_PHONE = /^[\d\s\-()+]+$/;

module.exports.OrderStatus = {
  WELCOME: 'WELCOME', // initional state
  LIST: 'LIST', // event selection
  EVENT: 'EVENT', // event info
  TICKET: 'TICKET', // choosing tickets
  NAME: 'NAME', // name input
  PHONE: 'PHONE', // phone input
  PAYMENT: 'PAYMENT', // payment request
  PAYMENT_RECEIPT_REQUEST: 'PAYMENT_RECEIPT_REQUEST',
  PAYMENT_DONE: 'PAYMENT_DONE',
};

module.exports.OrderStatusCode = {
  pending: 0,
  approved: 1,
  reject: 2,
};

module.exports.ChanelQuery = {
  NOTICE: 'notice',
  CONFIRM: 'confirm',
  REJECT: 'reject',
};

module.exports.UserQuery = {
  RESET: 'reset',
  RETURN_POLICY: 'returnPolicy',
};

module.exports.UserCommands = {
  START: {
    command: '/start',
    description: 'Выбрать мероприятие',
  },
  RECEIPT: {
    command: '/receipt',
    description: 'Отправить чек доплаты',
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

module.exports.EventCells = {
  LEGEND: 'A1:L1',
  DATA: 'A3:L9',
};

module.exports.OrderCells = {
  LEGEND: 'A1:L1',
  DATA: 'A3:L251',
};
