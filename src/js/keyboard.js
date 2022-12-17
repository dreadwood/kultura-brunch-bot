'use strict';

const {
  ChanelQuery,
  UserQuery,
  AdminQuery,
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
      [
        {
          text: 'запросить отзыв',
          callback_data: JSON.stringify({
            cmd: ChanelQuery.REVIEW,
            orderId,
          }),
        },
      ],
    ];
  },


  adminWelcome(adminId) {
    return [
      [
        {
          text: 'проданные билеты',
          callback_data: JSON.stringify({
            cmd: AdminQuery.TICKET,
            admin: adminId,
          }),
        },
      ],
      [
        {
          text: 'списки клиентов',
          callback_data: JSON.stringify({
            cmd: AdminQuery.LIST,
            admin: adminId,
          }),
        },
      ],
      [
        {
          text: 'отправка сообщения клиенту',
          callback_data: JSON.stringify({
            cmd: AdminQuery.MESSAGE,
            admin: adminId,
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
