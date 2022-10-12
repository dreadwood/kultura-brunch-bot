'use strict';

const {FEEDBACK, ACOUNT_NAME} = require('./const');
const keyboard = require('./keyboard');
const {ACCOUNT_NUMBER} = process.env;

class Screen {
  constructor(bot) {
    this._bot = bot;
  }


  welcome(chatId, events) {
    const text = 'Здравствуйте!\nНа какую встречу вы хотите записаться?';

    this._bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.welcome(events),
      },
    });
  }


  userListMistake(chatId, events) {
    const text = 'Выберете встречу для записи.';

    this._bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.welcome(events),
      },
    });
  }


  eventWithPoster(chatId, event, posterPath) {
    const text = event.description;

    this._bot.sendPhoto(chatId, posterPath, {
      caption: text,
      reply_markup: {
        inline_keyboard: keyboard.event(event.id),
      },
    }, {
      filename: event.poster,
      contentType: 'image/*',
    });
  }


  event(chatId, event) {
    const text = event.description;

    this._bot.sendMessage(chatId, text, {
      caption: text,
      reply_markup: {
        inline_keyboard: keyboard.event(event.id),
      },
    });
  }


  userEventNotFound(chatId) {
    const text = 'К сожалению, такого мероприятия нет.';

    this._bot.sendMessage(chatId, text);
  }


  eventMistake(chatId) {
    const text = 'Хотите выбрать другое мероприятие?';

    this._bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.reset(),
      },
    });
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


  name(chatId, selectedTickets) {
    const text = `Вы выбрали ${selectedTickets} билетов. Напишите, пожалуйста, ваше имя.`;

    this._bot.sendMessage(chatId, text);
  }


  nameMistake(chatId) {
    const text = 'Напишите ваше имя, пожалуйста.';

    this._bot.sendMessage(chatId, text);
  }


  phone(chatId) {
    const text = 'Для бронирования оставьте свой номер телефона';

    this._bot.sendMessage(chatId, text);
  }


  phoneMistake(chatId) {
    const text = 'Оставьте контактный номер телефона (допускаються цифры, пробел и символы "+", "-", "(", ")")';

    this._bot.sendMessage(chatId, text);
  }


  async payment(chatId, event) {
    const textInfoPay = `${event.infopay}\nAccount number / Name:`;
    const textRequestReceipt = 'Отправьте, пожалуйста, чек об оплате.';

    await this._bot.sendMessage(chatId, textInfoPay);
    await this._bot.sendMessage(chatId, ACCOUNT_NUMBER);
    await this._bot.sendMessage(chatId, ACOUNT_NAME);
    this._bot.sendMessage(chatId, textRequestReceipt, {
      reply_markup: {
        inline_keyboard: keyboard.payment(),
      },
    });
  }


  paymentMistake(chatId) {
    const text = 'Отправьте, пожалуйста, чек об оплате.';

    this._bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.payment(),
      },
    });
  }


  userReturnPolicy(chatId) {
    const text = `Правила отмены:\n
Если ваши планы поменялись,  более, чем за 2 дня (48 ч) до мероприятия, то мы вернем полностью всю ранее внесенную сумму.\n
Если ваши планы изменились  менее, чем за 2 дня (48 ч)  до встречи, то мы вернем 50%  от стоимости билета.\n
При отмене в день мероприятия,  оплата не возвращается.\n
💫 Если у вас остались вопросы по возврату свяжитесь с ${FEEDBACK}`;

    this._bot.sendMessage(chatId, text);
  }

  check(chatId) {
    const text = 'Спасибо! Мы забронировали за вами места. В ближайшее время мы проверим оплату.';

    this._bot.sendMessage(chatId, text);
  }


  checkMistake(chatId) {
    const text = 'Мы сейчас проверим чек и отправим вам потвержедние.';

    this._bot.sendMessage(chatId, text);
  }


  done(chatId) {
    const text = 'Поздравляем, оплата прошла. Будем ждать вас на мероприятии.';

    this._bot.sendMessage(chatId, text);
  }


  undone(chatId) {
    const text = `Почему-то мы не видем вашей оплаты. Прошу связаться с ${FEEDBACK}`;

    this._bot.sendMessage(chatId, text);
  }


  userNoticeEvent(chatId, event) {
    const text = event.notice;

    this._bot.sendMessage(chatId, text, {
      disable_web_page_preview: true,
    });
  }


  async chanelReceipt(chanelId, msg, stateUser) {
    const {message_id, from: {id, username}} = msg;
    const {event, name, phone, countTicket} = stateUser;

    const text = `Имя: ${name}
username: ${username}
phone: ${phone}
ticket: ${countTicket}
event: ${event.id}
`;

    await this._bot.forwardMessage(chanelId, id, message_id);
    this._bot.sendMessage(chanelId, text, {
      reply_markup: {
        inline_keyboard: keyboard.chanel(id, event.id),
      },
    });
  }


  chanelBadRequest(chanelId) {
    const text = 'Клавиши потверждения или отмены уже не актуальны';

    this._bot.sendMessage(chanelId, text);
  }


  chanelUserHasNoOrders(chanelId) {
    const text = 'Этот человек почему-то ничего не приобретал. Посмотрите таблицу.';

    this._bot.sendMessage(chanelId, text);
  }


  chanelNoEvent(chanelId) {
    const text = 'Невозможно найти такое событие. Проверте id event.';

    this._bot.sendMessage(chanelId, text);
  }
}

module.exports = Screen;
