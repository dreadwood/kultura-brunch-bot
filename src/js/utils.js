'use strict';

function debug(obj) {
  return JSON.stringify(obj, null, 4);
}

/**
 * @param {Date} date
 * @return {string} // 2019-12-01 14:45:00
 */
function getFormattedDate(date) {
  return date.toISOString().replace(/T/, ' ').replace(/\.[\s\S]*/g, '');
}

module.exports = {
  debug,
  getFormattedDate,
};
