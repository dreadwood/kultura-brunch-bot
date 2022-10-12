'use strict';

const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const State = require('./state');
const Screen = require('./screen');
const helpers = require('./helpers');
const {
  OrderStatus,
  ChanelCommands,
  UserCommands,
  REG_EXP_PHONE,
  BotCommands,
} = require('./const');
const {
  getEventData,
  addClientsData,
  getClientsData,
  getEventsData,
} = require('./data-service');

const {BOT_TOKEN, CHANEL_ID} = process.env;

const bot = new TelegramBot(BOT_TOKEN, {polling: true});
const state = new State();
const screen = new Screen(bot);

bot.setMyCommands([
  BotCommands.START,
]);


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
    const [userId, eventId, command] = query.data.split('_');
    const userState = state.getState(userId);

    if (userState?.status === OrderStatus.CHECK) {
      if (command === ChanelCommands.CONFIRM) {
        screen.done(userId);
      }

      if (command === ChanelCommands.REPORT) {
        screen.undone(userId);
      }

      state.setState(userId, {status: OrderStatus.WELCOME});
      return;
    }

    if (command === ChanelCommands.NOTICE) {
      const orders = await getClientsData();
      const userOrders = orders.filter((order) => order.user_id === userId && order.event_id === eventId);

      if (userOrders.length === 0) {
        screen.chanelUserHasNoOrders(CHANEL_ID);
      } else {
        const event = await getEventData(eventId);

        if (event) {
          screen.userNoticeEvent(userId, event);
        } else {
          screen.chanelNoEvent(CHANEL_ID);
        }

      }
      return;
    }

    screen.chanelBadRequest(CHANEL_ID);
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
      const events = await getEventsData();

      state.setState(chatId, {
        events,
        status: OrderStatus.LIST,
      });

      screen.welcome(chatId, events);
      break;
    }


    case OrderStatus.LIST: {
      if (type === 'callback_query') {
        const eventId = query.data;
        const event = await getEventData(eventId);

        if (!event) {
          screen.userEventNotFound(chatId);
          return;
        }

        state.setState(chatId, {
          event,
          status: OrderStatus.EVENT,
        });

        const posterPath = path.join(__dirname, '..', 'img', event.poster);

        if (event.poster && fs.existsSync(posterPath)) {
          screen.eventWithPoster(chatId, event, posterPath);
        } else {
          screen.event(chatId, event);
        }

      } else {
        const {events} = state.getState(chatId);
        screen.userListMistake(chatId, events);
      }
      break;
    }


    case OrderStatus.EVENT: {
      if (type === 'callback_query') {
        const {event} = state.getState(chatId);
        const orders = await getClientsData();

        const ordersEvent = orders.filter((order) => order.event_id === event.id);
        const ticketsOnSale = ordersEvent.reduce(
          (acc, order) => (acc -= Number(order.ticket)),
          Number(event.capacity),
        );

        if (ticketsOnSale <= 0) {
          screen.userTicketSoldOut(chatId);
          return;
        }

        screen.userTicket(chatId, ticketsOnSale);
        state.setState(chatId, {
          ticketsOnSale,
          startSessionTime: Date.now(),
          status: OrderStatus.TICKET,
        });
      } else {
        screen.eventMistake(chatId);
      }
      break;
    }


    case OrderStatus.TICKET: {
      const {ticketsOnSale, startSessionTime} = state.getState(chatId);

      // TODO 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.initionlState(chatId);
        return;
      }

      const enterNumber = Number(msg.text);

      if (type === 'text' && !isNaN(enterNumber)) {

        if (enterNumber > ticketsOnSale || enterNumber < 1) {
          screen.userTicketSoMany(chatId, ticketsOnSale);
        } else {
          screen.name(chatId, enterNumber);
          state.setState(chatId, {
            countTicket: enterNumber,
            status: OrderStatus.NAME,
          });
        }

      } else {
        screen.userTicket(chatId, ticketsOnSale);
      }
      break;
    }


    case OrderStatus.NAME: {
      const {startSessionTime} = state.getState(chatId);

      // TODO 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.initionlState(chatId);
        return;
      }

      if (type === 'text') {
        state.setState(chatId, {
          name: msg.text,
          status: OrderStatus.PHONE,
        });

        screen.phone(chatId);
      } else {
        screen.nameMistake(chatId);
      }
      break;
    }


    case OrderStatus.PHONE: {
      const {startSessionTime} = state.getState(chatId);

      // TODO 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.initionlState(chatId);
        return;
      }

      if (type === 'text') {

        if (msg.text.match(REG_EXP_PHONE)) {
          state.setState(chatId, {
            startSessionTime: Date.now(),
            phone: msg.text.replace('+', 'plus'),
            status: OrderStatus.PAYMENT,
          });

          const {event} = state.getState(chatId);
          screen.userPayment(chatId, event);
        } else {
          screen.phoneMistake(chatId);
        }

      } else {
        screen.phone(chatId);
      }
      break;
    }


    case OrderStatus.PAYMENT: {
      const {startSessionTime} = state.getState(chatId);

      // TODO 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.initionlState(chatId);
        return;
      }

      if (type === 'callback_query' && query.data === UserCommands.RETURN_POLICY) {
        screen.userReturnPolicy(chatId);
        return;
      }

      // добавить таймер для оплаты (10 минут), если не успел отправляет сообщение
      // добавить статус "времено забронено"
      if (type === 'photo' || type === 'document') {
        screen.check(chatId);
        state.setState(chatId, {status: OrderStatus.CHECK});

        const stateUser = state.getState(chatId);
        const {event, name, phone, countTicket} = stateUser;
        screen.chanelReceipt(CHANEL_ID, msg, stateUser);

        addClientsData([
          chatId,
          msg.from.first_name,
          msg.from.last_name,
          msg.from.username,
          name,
          phone,
          countTicket,
          '', // payment,
          new Date().toLocaleString(),
          event.id,
        ]);

        return;
      }

      screen.paymentMistake(chatId);
      break;
    }


    case OrderStatus.CHECK: {
      screen.userCheckReceipt(chatId);
      break;
    }
  }
}
