'use strict';

const keyboard = require('./keyboard');
const {
  FEEDBACK_CONTACT,
  ACOUNT_NAME,
  ACCOUNT_NUMBER,
} = process.env;

class Screen {
  constructor(bot) {
    this._bot = bot;
  }


  userList(chatId, events, opt = {}) {
    const text = opt.repeat
      ? 'Выберите встречу для записи.'
      : 'Здравствуйте!\nНа какую встречу вы хотите записаться?';

    this._bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.userWelcome(events),
      },
    });
  }


  userNoEvents(chatId) {
    const text = 'Здравствуйте!\nК сожалению, в ближайшее время мероприятий нет.';

    this._bot.sendMessage(chatId, text);
  }


  userEventPoster(chatId, event, posterPath) {
    const text = event.description;

    this._bot.sendPhoto(chatId, posterPath, {
      caption: text,
      reply_markup: {
        inline_keyboard: keyboard.userEvent(),
      },
    }, {
      filename: event.poster,
      contentType: 'image/*',
    });
  }


  userEvent(chatId, event) {
    const text = event.description;

    this._bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.userEvent(),
      },
    });
  }


  userEventAnother(chatId) {
    const text = 'Хотите выбрать другое мероприятие?';

    this._bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.reset(),
      },
    });
  }


  userEventNotFound(chatId) {
    const text = 'К сожалению, такого мероприятия нет.';

    this._bot.sendMessage(chatId, text);
  }


  userTicket(chatId, ticket) {
    const text = `Сколько вам билетов? Отправьте число от 1 до ${ticket}`;

    this._bot.sendMessage(chatId, text);
  }


  userTicketSoldOut(chatId) {
    const text = 'К сожалению, на это мероприятие билетов больше нет';

    this._bot.sendMessage(chatId, text);
  }


  userTicketSoMany(chatId, ticket) {
    const text = `К сожалению, столько билетов на это мероприятие нет. Отправьте число от 1 до ${ticket}`;

    this._bot.sendMessage(chatId, text);
  }


  userName(chatId, selectedTickets) {
    const text = `Вы выбрали ${selectedTickets} билетов. Напишите, пожалуйста, ваше имя.`;

    this._bot.sendMessage(chatId, text);
  }


  userPhone(chatId, opt = {}) {
    const text = opt.repeat
      ? 'Оставьте контактный номер телефона (допускаються цифры, пробел и символы "+", "-", "(", ")")'
      : 'Для бронирования оставьте свой номер телефона';

    this._bot.sendMessage(chatId, text);
  }


  async userPayment(chatId, event, opt = {}) {
    const textRequestReceipt = opt.repeat
      ? 'Отправьте, пожалуйста, чек об оплате (фото или pdf).'
      : 'Бронь действительна в течение 10 минут.\nОтправьте, пожалуйста, чек об оплате.';

    if (event) {
      const textInfoPay = `${event.infopay}\nAccount number / Name:`;

      await this._bot.sendMessage(chatId, textInfoPay);
      await this._bot.sendMessage(chatId, ACCOUNT_NUMBER);
      await this._bot.sendMessage(chatId, ACOUNT_NAME);
    }

    this._bot.sendMessage(chatId, textRequestReceipt, {
      reply_markup: {
        inline_keyboard: keyboard.userPayment(),
      },
    });
  }


  userReturnPolicy(chatId) {
    const text = `Правила отмены:\n
Если ваши планы поменялись, более, чем за 2 дня (48 ч) до мероприятия, то мы вернем полностью всю ранее внесенную сумму.\n
Если ваши планы изменились менее, чем за 2 дня (48 ч) до встречи, то мы вернем 50% от стоимости билета.\n
При отмене в день мероприятия, оплата не возвращается.\n
💫 Если у вас остались вопросы по возврату свяжитесь с ${FEEDBACK_CONTACT}`;

    this._bot.sendMessage(chatId, text);
  }


  userCheck(chatId) {
    const text = 'Спасибо! Мы забронировали за вами места. В ближайшее время мы проверим оплату.';

    this._bot.sendMessage(chatId, text);
  }


  userDone(chatId, event) {
    const text = `Поздравляем, оплата за "${event.date} / ${event.title}" прошла. Будем ждать вас на мероприятии.`;

    this._bot.sendMessage(chatId, text);
  }


  userUndone(chatId, event) {
    const text = `Почему-то мы не видем вашей оплаты за "${event.date} / ${event.title}" или произошла другая ошибка. Просим связаться с ${FEEDBACK_CONTACT}`;

    this._bot.sendMessage(chatId, text);
  }


  userNoticeEvent(chatId, event) {
    const text = event.notice;

    this._bot.sendMessage(chatId, text, {
      disable_web_page_preview: true,
    });
  }


  userTimeUp(chatId) {
    const text = 'К сожалению, время заказа вышло. Выберете мероприятие заново';

    this._bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.reset(),
      },
    });
  }


  async userPaymentRequest(chatId) {
    const text = 'Отправьте, пожалуйста, чек доплаты (фото или pdf). Реквизиты:\nAccount number / Name';

    await this._bot.sendMessage(chatId, text);
    await this._bot.sendMessage(chatId, ACCOUNT_NUMBER);
    await this._bot.sendMessage(chatId, ACOUNT_NAME);
  }


  userPaymentDone(chatId) {
    const text = 'Спасибо! Будем рады вас видеть снова.';

    this._bot.sendMessage(chatId, text);
  }


  userGetReview(chatId) {
    const text = 'Спасибо, что посетили нас! Будем рады если вы оставите о нас отзыв. Хорошего дня!';

    this._bot.sendMessage(chatId, text);
  }


  userUnknownError(userId) {
    const text = `Простите, произошла непредвиденная ошибка, попробуйте заново. Если ошибка повторилась свяжитесь с ${FEEDBACK_CONTACT}`;

    this._bot.sendMessage(userId, text);
  }


  chanelReceipt(chanelId, userId, msg) {
    const {message_id} = msg;

    this._bot.forwardMessage(chanelId, userId, message_id);
  }


  chanelUserDataCheck(chanelId, stateUser) {
    const {event, name, phone, countTicket, userName, orderId} = stateUser;

    const text = `Имя: ${name}
username: @${userName}
phone: ${phone}
ticket: ${countTicket}
event: ${event.id}`;

    this._bot.sendMessage(chanelId, text, {
      reply_markup: {
        inline_keyboard: keyboard.chanelCheck(orderId),
      },
    });
  }


  chanelUserDataNotice(chanelId, messageId, adminName, userOrder) {
    const {
      event_id: eventId,
      name, phone,
      ticket: countTicket,
      username: userName,
      order_id: orderId,
    } = userOrder;

    const text = `Имя: ${name}
username: @${userName}
phone: ${phone}
ticket: ${countTicket}
event: ${eventId}

@${adminName} подтвердил чек 📝`;

    this._bot.editMessageText(text, {
      chat_id: chanelId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: keyboard.chanelNotice(orderId),
      },
    });
  }


  chanelUserDataReject(chanelId, messageId, adminName, userOrder) {
    const {
      event_id: eventId,
      name,
      phone,
      ticket: countTicket,
      username: userName,
    } = userOrder;

    const text = `Имя: ${name}
username: @${userName}
phone: ${phone}
ticket: ${countTicket}
event: ${eventId}

@${adminName} ОТКЛОНИЛ заказ ❌`;

    this._bot.editMessageText(text, {
      chat_id: chanelId,
      message_id: messageId,
    });
  }


  chanelUserDataNoticeRepeat(chanelId, messageId, adminName, userOrder) {
    const {
      event_id: eventId,
      name,
      phone,
      ticket: countTicket,
      username: userName,
      order_id: orderId,
    } = userOrder;

    const text = `Имя: ${name}
username: @${userName}
phone: ${phone}
ticket: ${countTicket}
event: ${eventId}

@${adminName} отправил напоминание ✅`;

    this._bot.editMessageText(text, {
      chat_id: chanelId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: keyboard.chanelNotice(orderId, {repeat: true}),
      },
    });
  }


  chanelGetUserReview(chanelId, adminName, userOrder) {
    const {
      event_id: eventId,
      username: userName,
    } = userOrder;

    const text = `Запросили отзыв о мероприятии ${eventId} у @${userName}. @${adminName}`;

    this._bot.sendMessage(chanelId, text);
  }


  chanelBadRequest(chanelId, adminName) {
    const text = `Клавиши потверждения, отмены, напоминания уже не актуальны. @${adminName}`;

    this._bot.sendMessage(chanelId, text);
  }


  chanelUserHasNoOrder(chanelId, adminName) {
    const text = `Нельзя отправить напоминание. Не найден заказ, посмотрите таблицу. @${adminName}`;

    this._bot.sendMessage(chanelId, text);
  }


  chanelNoEvent(chanelId, adminName) {
    const text = `Не найдено событие, посмотрите таблицу. @${adminName}`;

    this._bot.sendMessage(chanelId, text);
  }


  chanelNoNotice(chanelId, adminName) {
    const text = `Нельзя отправить напоминание, не найдено его уведомление, посмотрите таблицу. @${adminName}`;

    this._bot.sendMessage(chanelId, text);
  }


  chanelPaymentReceipt(chanelId, userId, msg) {
    const {message_id} = msg;

    this._bot.forwardMessage(chanelId, userId, message_id);
  }


  chanelPaymentData(chanelId, stateUser) {
    const {userName} = stateUser;

    const text = `ДОПЛАТА 💰
username: @${userName}`;

    this._bot.sendMessage(chanelId, text);
  }


  chanelUnknownError(chanelId) {
    const text = 'Произошла непредвиденная ошибка, посмотрите логи';

    this._bot.sendMessage(chanelId, text);
  }

}

module.exports = Screen;
