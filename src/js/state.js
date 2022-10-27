'use strict';

const {OrderStatus} = require('./const');
const {getLogger} = require('./logger');

const logger = getLogger({name: 'state'});

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
      startSessionTime: 0,
      status: OrderStatus.WELCOME,
    };

    logger.info(`${id} init`);
  }

  checkState(id) {
    return !!this._state[id];
  }

  setState(id, date) {
    this._state[id] = {
      ...this._state[id],
      ...date,
    };

    // FIXME: 2022-10-13 /
    if (date.event) {
      date.event = date.event.id;
    }

    logger.info(`${id} ${JSON.stringify(date)}`);
  }

  getState(id) {
    return this._state[id];
  }
}

module.exports = State;
