'use strict';

const {
  ChanelCommands,
  UserCommands,
} = require('./const');

const RESET_BUTTON_TEXT = 'выбрать другое мероприятие';

module.exports = {

  // keyboard by screen name
  welcome(events) {
    return events.map((event) => [{
      text: `${event.date} / ${event.title}`,
      callback_data: event.id,
    }]);
  },


  event(eventId) {
    return [
      [
        {
          text: 'купить билет',
          callback_data: eventId,
        },
      ],
      [
        {
          text: RESET_BUTTON_TEXT,
          callback_data: UserCommands.RESET,
        },
      ],
    ];
  },


  payment() {
    return [
      [
        {
          text: 'правила возврата',
          callback_data: UserCommands.RETURN_POLICY,
        },
      ],
    ];
  },


  chanel(userId, eventId) {
    return [
      [
        {
          text: 'потвердить',
          callback_data: `${userId}_${eventId}_${ChanelCommands.CONFIRM}`,
        },
        {
          text: 'не ок',
          callback_data: `${userId}_${eventId}_${ChanelCommands.REPORT}`,
        },
      ],
      [
        {
          text: 'отправить уведомление',
          callback_data: `${userId}_${eventId}_${ChanelCommands.NOTICE}`,
        },
      ],
    ];
  },


  // ==================================
  //
  // common keyboard
  reset() {
    return [
      [
        {
          text: RESET_BUTTON_TEXT,
          callback_data: UserCommands.RESET,
        },
      ],
    ];
  },
};
