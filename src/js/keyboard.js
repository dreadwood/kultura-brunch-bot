'use strict';

const {
  ChanelQuery,
  UserQuery,
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
          callback_data: UserQuery.RESET,
        },
      ],
    ];
  },


  payment() {
    return [
      [
        {
          text: 'правила возврата',
          callback_data: UserQuery.RETURN_POLICY,
        },
      ],
    ];
  },


  chanelCheck(userId, userName, eventId) {
    return [
      [
        {
          text: 'потвердить',
          callback_data: `${userId}_${userName}_${eventId}_${ChanelQuery.CONFIRM}`,
        },
        {
          text: 'отклонить',
          callback_data: `${userId}_${userName}_${eventId}_${ChanelQuery.REJECT}`,
        },
      ],
    ];
  },


  chanelNotice(userId, userName, eventId) {
    return [
      [
        {
          text: 'отправить уведомление',
          callback_data: `${userId}_${userName}_${eventId}_${ChanelQuery.NOTICE}`,
        },
      ],
    ];
  },


  chanelNoticeRepeat(userId, userName, eventId) {
    return [
      [
        {
          text: 'повторно отправить уведомление',
          callback_data: `${userId}_${userName}_${eventId}_${ChanelQuery.NOTICE}`,
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
          callback_data: UserQuery.RESET,
        },
      ],
    ];
  },
};
