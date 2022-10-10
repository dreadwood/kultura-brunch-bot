'use strict';

const {getTitleEventTempale} = require('./templates');

/**
* @async
* @returns {Array.<{text: string, callback_data: string}[]>}
* keyboard with id event
*/
const getEventListKeyboard = (eventsData) => {
  const keyboard = eventsData.map((eventData) => [{
    text: getTitleEventTempale(eventData),
    callback_data: eventData.id,
  }]);

  return keyboard;
};

module.exports = {
  getEventListKeyboard,
};
