'use strict';

module.exports.SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

module.exports.LOG_FILE = 'bot.log';
module.exports.DEFAULT_LOG_LEVEL = 'info';
module.exports.RUS_LOCAL = 'ru-RU';

module.exports.TIME_SESSION = 600000;
module.exports.LENGTH_ORDER_ID = 6;
module.exports.REG_EXP_PHONE = /^[\d\s\-()+]+$/;

module.exports.OrderStatus = {
  BUY_WELCOME: 'BUY_WELCOME',
  BUY_LIST: 'BUY_LIST',
  BUY_EVENT: 'BUY_EVENT',
  BUY_TICKET: 'BUY_TICKET',
  BUY_NAME: 'BUY_NAME',
  BUY_PHONE: 'BUY_PHONE',
  BUY_PAYMENT: 'BUY_PAYMENT',
  PAYMENT_REQUEST: 'PAYMENT_RECEIPT_REQUEST',
  PAYMENT_RECEIPT: 'PAYMENT_RECEIPT',
};

// module.exports.OrderStatusCode = {
//   pending: 0,
//   approved: 1,
//   reject: 2,
// };

module.exports.ChanelQuery = {
  NOTICE: 'notice',
  CONFIRM: 'confirm',
  REJECT: 'reject',
  REVIEW: 'review',
};

module.exports.UserQuery = {
  RESET: 'reset',
  RETURN_POLICY: 'returnPolicy',
  SELECT: 'select',
  BUY: 'buy',
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
  DATA: 'A3:L',
};

module.exports.OrderCells = {
  LEGEND: 'A1:L1',
  DATA: 'A3:L',
};
