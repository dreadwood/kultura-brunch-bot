'use strict';

const {OrderStatus} = require('./const');

class State {
  constructor() {
    this._state = {};
  }

  initionlState(id) {
    this._state[id] = {
      name: null,
      phone: null,
      countTicket: null,
      ticketsOnSale: null,
      event: null,
      events: [],
      status: OrderStatus.WELCOME,
    };
  }

  checkState(id) {
    return !!this._state[id];
  }

  setState(id, date) {
    this._state[id] = {
      ...this._state[id],
      ...date,
    };
  }

  getState(id) {
    return this._state[id];
  }
}

module.exports = State;


// TYPES
// =========================

// msg text
// {
//   message_id: 490,
//   from: {
//     id: 174769289,
//     is_bot: false,
//     first_name: 'srg',
//     username: 'dreadwood',
//     language_code: 'ru'
//   },
//   chat: {
//     id: 174769289,
//     first_name: 'srg',
//     username: 'dreadwood',
//     type: 'private'
//   },
//   date: 1665157736,
//   text: '1'
// }


// msg contact
// {
//   message_id: 564,
//   from: {
//     id: 174769289,
//     is_bot: false,
//     first_name: 'srg',
//     username: 'dreadwood',
//     language_code: 'ru'
//   },
//   chat: {
//     id: 174769289,
//     first_name: 'srg',
//     username: 'dreadwood',
//     type: 'private'
//   },
//   date: 1665160437,
//   contact: {
//     phone_number: '79650713187',
//     first_name: 'srg',
//     user_id: 174769289
//   }
// }


// query
// {
//   id: '750628381361245491',
//   from: {
//     id: 174769289,
//     is_bot: false,
//     first_name: 'srg',
//     username: 'dreadwood',
//     language_code: 'ru'
//   },
//   message: {
//     message_id: 499,
//     from: {
//       id: 5768834578,
//       is_bot: true,
//       first_name: 'KulturaBrunchBot',
//       username: 'KulturaBrunchBot'
//     },
//     chat: {
//       id: 174769289,
//       first_name: 'srg',
//       username: 'dreadwood',
//       type: 'private'
//     },
//     date: 1665158190,
//     text: '"Здравствуйте!\nНа какую встречу вы хотите записаться?"',
//     reply_markup: { inline_keyboard: [Array] }
//   },
//   chat_instance: '-9169950933470697649',
//   data: 'info-pol_gogen'
// }
