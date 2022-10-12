'use strict';

const {FEEDBACK, ACOUNT_NAME} = require('./const');
const keyboard = require('./keyboard');
const {ACCOUNT_NUMBER} = process.env;


module.exports = {
  async welcome(bot, chatId, event) {
    const text = 'Здравствуйте!\nНа какую встречу вы хотите записаться?';

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.welcome(event),
      },
    });
  },


  async eventWithPoster(bot, chatId, event, posterPath) {
    const text = event.description;

    bot.sendPhoto(chatId, posterPath, {
      caption: text,
      reply_markup: {
        inline_keyboard: keyboard.event(event.id),
      },
    }, {
      filename: event.poster,
      contentType: 'image/*',
    });
  },

  async event(bot, chatId, event) {
    const text = event.description;

    bot.sendMessage(chatId, text, {
      caption: text,
      reply_markup: {
        inline_keyboard: keyboard.event(event.id),
      },
    });
  },


  eventMistake(bot, chatId) {
    const text = 'Хотите выбрать другое мероприятие?';

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.reset(),
      },
    });
  },


  ticket(bot, chatId, ticket) {
    const text = `Сколько вам билетов? Отправьте число от 1 до ${ticket}`;

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.reset(),
      },
    });
  },


  name(bot, chatId, selectedTickets) {
    const text = `Вы выбрали ${selectedTickets} билетов. Напишите, пожалуйста, ваше имя`;

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.reset(),
      },
    });
  },


  phone(bot, chatId) {
    const text = 'Для бронирования оставьте свой номер телефона';

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.reset(),
      },
    });
  },


  phoneMistake(bot, chatId) {
    const text = 'Оставьте контактный номер телефона (допускаються цифры, пробел и символы "+", "-", "(", ")")';

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.reset(),
      },
    });
  },


  async payment(bot, chatId, event) {
    const text1 = event.infopay;
    const text2 = `Account number: ${ACCOUNT_NUMBER}`;
    const text3 = `Имя: ${ACOUNT_NAME}`;
    const text4 = 'Отправьте, пожалуйста, чек об оплате.';

    await bot.sendMessage(chatId, text1);
    await bot.sendMessage(chatId, text2);
    await bot.sendMessage(chatId, text3);
    bot.sendMessage(chatId, text4, {
      reply_markup: {
        inline_keyboard: keyboard.reset(),
      },
    });
  },


  async paymentMistake(bot, chatId) {
    const text = 'Отправьте, пожалуйста, чек об оплате.';

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: keyboard.reset(),
      },
    });
  },


  check(bot, chatId) {
    const text = 'Спасибо! Мы забронировали за вами места. В ближайшее время мы проверим оплату.';

    bot.sendMessage(chatId, text);
  },


  done(bot, chatId) {
    const text = 'Поздравляем оплата прошла. Мы ждем вас [дополнительная информация].';

    bot.sendMessage(chatId, text);
  },


  undone(bot, chatId) {
    const text = `Почему-то мы не видем вашей оплаты. Прошу связаться с ${FEEDBACK}`;

    bot.sendMessage(chatId, text);
  },


  async chanel(bot, chanelId, msg, stateUser) {
    const {message_id, from: {id, username}} = msg;
    const {event, name, phone, countTicket} = stateUser;

    const text = `Имя: ${name}
username: ${username}
phone: ${phone}
ticket: ${countTicket}
event: ${event.id}
`;

    await bot.forwardMessage(chanelId, id, message_id);
    await bot.sendMessage(chanelId, text, {
      reply_markup: {
        inline_keyboard: keyboard.chanel(id),
      },
    });
  },
};
