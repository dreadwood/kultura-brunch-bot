'use strict';

const TelegramBot = require('node-telegram-bot-api');
const {OrderStatus, ChanelCommands, UserCommands} = require('./const');
const {getEventData, addClientsData, getClientsData, getEventsData} = require('./data-service');
const screen = require('./screen');
const State = require('./state');
// const {debug} = require('./utils');

const {BOT_TOKEN, CHANEL_ID} = process.env;
const bot = new TelegramBot(BOT_TOKEN, {polling: true});

const state = new State();

bot.on('message', (msg, metadata) => {
  const chatId = msg.chat.id;

  if (metadata.type === 'text' && msg.text === '/start') {
    state.initionlState(chatId);
  }

  processRequest(chatId, msg, null, metadata.type);
});


bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (chatId === Number(CHANEL_ID)) {
    const [userId, answer] = query.data.split('_');

    if (answer === ChanelCommands.CONFIRM) {
      screen.done(bot, userId);
    }

    if (answer === ChanelCommands.REPORT) {
      screen.undone(bot, userId);
    }

    state.setState(chatId, {status: OrderStatus.WELCOME});

    return;
  }

  if (query.data === UserCommands.RESET) {
    state.initionlState(chatId);
  }

  processRequest(chatId, null, query, 'callback_query');
});


async function processRequest(chatId, msg, query, type) {
  if (!state.checkState(chatId)) {
    state.initionlState(chatId);
  }
  const {status} = state.getState(chatId);

  switch (status) {
    case OrderStatus.WELCOME: {
      const event = await getEventsData();
      screen.welcome(bot, chatId, event);

      state.setState(chatId, {status: OrderStatus.LIST});
      break;
    }


    case OrderStatus.LIST: {
      if (type === 'callback_query') {
        const eventId = query.data;
        const event = await getEventData(eventId);

        if (!event) {
          bot.sendMessage(chatId, 'К сожалению, такого мероприятия нет.');
          return;
        }

        state.setState(chatId, {
          event,
          status: OrderStatus.EVENT,
        });

        screen.event(bot, chatId, event);
      }
      break;
    }


    case OrderStatus.EVENT: {
      if (type === 'callback_query') {
        const {event} = state.getState(chatId);
        const orders = await getClientsData();

        const ordersEvent = orders.filter((order) => order.event === event.id);
        const ticketsOnSale = ordersEvent.reduce(
          (acc, order) => (acc -= Number(order.ticket)),
          Number(event.capacity),
        );

        if (ticketsOnSale <= 0) {
          bot.sendMessage(chatId, 'К сожалению, на это мероприятие билетов больше нет');
          return;
        }

        screen.ticket(bot, chatId, ticketsOnSale);
        state.setState(chatId, {
          ticketsOnSale,
          status: OrderStatus.TICKET,
        });
      } else {
        screen.eventMistake(bot, chatId);
      }
      break;
    }


    case OrderStatus.TICKET: {
      const {ticketsOnSale} = state.getState(chatId);
      const enterNumber = Number(msg.text);

      if (type === 'text' && !isNaN(enterNumber)) {

        if (enterNumber > ticketsOnSale || enterNumber < 1) {
          screen.ticket(bot, chatId, ticketsOnSale);
        } else {
          screen.name(bot, chatId, enterNumber);
          state.setState(chatId, {
            countTicket: enterNumber,
            status: OrderStatus.NAME,
          });
        }

      } else {
        screen.ticket(bot, chatId, ticketsOnSale);
      }
      break;
    }


    case OrderStatus.NAME: {
      if (type === 'text') {
        state.setState(chatId, {
          name: msg.text,
          status: OrderStatus.PHONE,
        });

        screen.phone(bot, chatId);
      } else {
        const {countTicket} = state.getState(chatId);
        screen.name(bot, chatId, countTicket);
      }
      break;
    }


    case OrderStatus.PHONE: {
      if (type === 'text') {
        state.setState(chatId, {
          phone: msg.text,
          status: OrderStatus.PAYMENT,
        });

        const {event} = state.getState(chatId);
        screen.payment(bot, chatId, event);
      } else {
        screen.phone(bot, chatId);
      }
      break;
    }


    case OrderStatus.PAYMENT: {
      // добавить таймер для оплаты (10 минут), если не успел отправляет сообщение
      // добавить статус "времено забронено"
      if (type === 'photo' || type === 'document') {
        screen.check(bot, chatId);
        state.setState(chatId, {status: OrderStatus.CHECK});

        const stateUser = state.getState(chatId);
        const {event, name, phone, countTicket} = stateUser;
        screen.chanel(bot, CHANEL_ID, msg, stateUser);

        addClientsData([
          chatId,
          msg.from.first_name, // first
          msg.from.last_name, // last
          msg.from.username, // nick
          name,
          phone,
          countTicket, // ticket
          '', // payment,
          new Date().toLocaleString(), // date
          event.id, // event
        ]);

      } else {
        const {event} = state.getState(chatId);
        screen.payment(bot, chatId, event);
      }
      break;
    }


    case OrderStatus.CHECK: {
      bot.sendMessage(chatId, 'Мы сейчас проверим чек и отправим вам потвержедние');
      break;
    }


    case OrderStatus.DONE: {
      // screen.done(bot, chatId);
      // state.setState(chatId, {status: OrderStatus.WELCOME});
      break;
    }

    default: {
      state.initionlState(chatId);
      screen.welcome(bot, chatId);
      break;
    }
  }
}
