'use strict';

const {OrderStatus} = require('./const');

class State {
  constructor() {
    this._state = {};
  }

  initionlState(id) { // TODO: 2022-10-07 / private?
    this._state[id] = {
      input: {
        name: null,
        phone: null,
        countTicket: null,
      },
      event: null,
      status: OrderStatus.WELCOME,
    };
    // console.log(`Создан новый state для пользователя ${id}`);
  }

  checkUser(id) {
    if (!this._state[id]) {
      this.initionlState(id);
    }
  }

  changeStatus(id, status) {
    this._state[id].status = status;
    // console.log(`Состояние изменилось на ${status}`);
  }

  getInput(id) {
    return this._state[id].input;
  }

  setInput(id, obj) {
    console.log(this._state);
    console.log(obj);
    this._state[id].input = {
      ...this._state[id].input,
      obj,
    };
  }

  getStatus(id) {
    if (!this._state[id]) {
      this.initionlState(id);
    }

    return this._state[id].status;
  }

  setEvent(id, event) {
    this._state[id].event = event;
    // console.log(`Было выбрано событие ${event.title}`);
  }

  getEvent(id) {
    return this._state[id].event;
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
