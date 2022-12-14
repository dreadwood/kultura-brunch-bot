'use strict';

const {OrderStatus} = require('./const');
const {getLogger} = require('./logger');

const logger = getLogger();

class State {
  constructor() {
    this._state = {};
  }

  initionlState(user) {
    this._state[user.id] = {
      orderId: null,
      name: null,
      phone: null,
      userName: user.username,
      countTicket: null,
      ticketsOnSale: null,
      event: null,
      startSessionTime: 0,
      status: OrderStatus.WELCOME,
    };

    logger.info(`${user.username} ${user.id} 'STATE' init`);
  }

  checkState(id) {
    return !!this._state[id];
  }

  setState(id, date) {
    this._state[id] = {
      ...this._state[id],
      ...date,
    };

    // TODO: 2022-10-13 / needed?
    if (date.event) {
      date.event = date.event.id;
    }

    logger.info(`${this._state[id].userName} ${id} 'STATE' ${JSON.stringify(date)}`);
  }

  getState(id) {
    return this._state[id];
  }
}

module.exports = State;
