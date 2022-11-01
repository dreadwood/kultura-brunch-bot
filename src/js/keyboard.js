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
      callback_data: event.id, // TODO: 2022-11-01 / add comand
    }]);
  },


  event(eventId) {
    return [
      [
        {
          text: 'купить билет',
          callback_data: eventId, // TODO: 2022-11-01 / add comand
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


  chanelCheck(orderId) {
    return [
      [
        {
          text: 'потвердить',
          callback_data: JSON.stringify({
            cmd: ChanelQuery.CONFIRM,
            orderId,
          }),
        },
        {
          text: 'отклонить',
          callback_data: JSON.stringify({
            cmd: ChanelQuery.REJECT,
            orderId,
          }),
        },
      ],
    ];
  },


  chanelNotice(orderId, isRepeat) {
    return [
      [
        {
          text: `${isRepeat ? 'повторно ' : ''}отправить напоминание`,
          callback_data: JSON.stringify({
            cmd: ChanelQuery.NOTICE,
            orderId,
          }),
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
