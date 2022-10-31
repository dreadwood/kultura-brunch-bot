'use strict';

const {OrderStatus} = require('./const');
const {getLogger} = require('./logger');

const logger = getLogger({name: 'state'});

class State {
  constructor() {
    this._state = {};
  }

  initionlState(user) {
    this._state[user.id] = {
      name: null,
      phone: null,
      userName: user.username,
      countTicket: null,
      ticketsOnSale: null,
      event: null,
      startSessionTime: 0,
      status: OrderStatus.WELCOME,
    };

    logger.info(`${user.username} init`);
  }

  checkState(id) {
    return !!this._state[id];
  }

  setState(id, date) {
    // TODO: 2022-11-01 / needed?
    if (!this.checkState(id)) {
      this.initionlState(id);
    }

    this._state[id] = {
      ...this._state[id],
      ...date,
    };

    // FIXME: 2022-10-13 /
    if (date.event) {
      date.event = date.event.id;
    }

    logger.info(`${this._state[id].username} ${JSON.stringify(date)}`);
  }

  getState(id) {
    return this._state[id];
  }
}

module.exports = State;
