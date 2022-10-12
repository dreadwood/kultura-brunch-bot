'use strict';

const {TIME_SESSION} = require('./const');

module.exports = {
  isSessionTimeUp(startSessionTime) {
    return Date.now() - startSessionTime > TIME_SESSION;
  },
};
