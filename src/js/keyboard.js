'use strict';

const {
  ChanelQuery,
  UserQuery,
} = require('./const');

const RESET_BUTTON_TEXT = 'выбрать другое мероприятие';

module.exports = {

  // keyboard by screen name
  userWelcome(events) {
    return events.map((event) => [{
      text: `${event.date} / ${event.title}`,
      callback_data: JSON.stringify({
        cmd: UserQuery.SELECT,
        eventId: event.id,
      }),
    }]);
  },


  userEvent() {
    return [
      [
        {
          text: 'купить билет',
          callback_data: JSON.stringify({
            cmd: UserQuery.BUY,
          }),
        },
      ],
      [
        {
          text: RESET_BUTTON_TEXT,
          callback_data: JSON.stringify({
            cmd: UserQuery.RESET,
          }),
        },
      ],
    ];
  },


  userPayment() {
    return [
      [
        {
          text: 'правила возврата',
          callback_data: JSON.stringify({
            cmd: UserQuery.RETURN_POLICY,
          }),
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


  chanelNotice(orderId, opt = {}) {
    return [
      [
        {
          text: `${opt.repeat ? 'повторно ' : ''}отправить напоминание`,
          callback_data: JSON.stringify({
            cmd: ChanelQuery.NOTICE,
            orderId,
          }),
        },
      ],
    ];
  },


  // ==================================


  // common keyboard
  reset() {
    return [
      [
        {
          text: RESET_BUTTON_TEXT,
          callback_data: JSON.stringify({
            cmd: UserQuery.RESET,
          }),
        },
      ],
    ];
  },
};
