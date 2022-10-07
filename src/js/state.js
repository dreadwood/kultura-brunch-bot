'use strict';

const {OrderStatus} = require('./const');

class State {
  constructor() {
    this._state = {};
  }

  initionlState(id) { // TODO: 2022-10-07 / private?
    this._state[id] = {
      event: null,
      status: OrderStatus.WELCOME,
    };
    console.log(`Создан новый state для пользователя ${id}`);
  }

  checkUser(id) {
    if (!this._state[id]) {
      this.initionlState(id);
    }
  }

  changeStatus(id, status) {
    this._state[id].status = status;
    console.log(`Состояние изменилось на ${status}`);
  }

  getStatus(id) {
    return this._state[id].status;
  }

  setEvent(id, event) {
    this._state[id].event = event;
    console.log(`Было выбрано событие ${event.title}`);
  }

  getEvent(id) {
    return this._state[id].event;
  }
}

module.exports = State;
