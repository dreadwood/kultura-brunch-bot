'use strict';

const {TIME_SESSION} = require('./const');

module.exports = {
  isSessionTimeUp(startSessionTime) {
    return Date.now() - startSessionTime > TIME_SESSION;
  },

  /**
  * Определяет прошла ли указаная дата
  * @param {boolean} date exam 22.10.2022
  * @returns {boolean}
  */
  isDatePassed(date) {
    const MS_IN_DAY = 86400000;
    return Date.parse(date.split('.').reverse().join('-')) + MS_IN_DAY < Date.now();
  },
};
