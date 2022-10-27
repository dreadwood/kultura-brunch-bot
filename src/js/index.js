'use strict';

const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const State = require('./state');
const Screen = require('./screen');
const helpers = require('./helpers');
const {getLogger} = require('./logger');
const {
  OrderStatus,
  ChanelCommands,
  UserCommands,
  REG_EXP_PHONE,
  BotCommands,
} = require('./const');
const {
  getEventData,
  addOrdersData,
  getOrdersData,
  getEventsData,
} = require('./data-service');

const {BOT_TOKEN, CHANEL_ID} = process.env;

const logger = getLogger({name: 'commd'});
const bot = new TelegramBot(BOT_TOKEN, {polling: true});
const state = new State();
const screen = new Screen(bot);

bot.setMyCommands([
  BotCommands.START,
]);

logger.info('START BOT');

bot.on('message', (msg, metadata) => {
  const chatId = msg.chat.id;

  logger.info(`${chatId} '${metadata.type}' ${msg.text || ''}`);

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

    logger.info(`${CHANEL_ID} 'callback_query' ${query.data}`);

    if (userState?.status === OrderStatus.CHECK) {

      if (command === ChanelCommands.CONFIRM) {
        await screen.userDone(userId);
        await screen.chanelResponce(CHANEL_ID);
      }

      if (command === ChanelCommands.REPORT) {
        await screen.userUndone(userId);
        await screen.chanelResponce(CHANEL_ID);
      }

      // change inition state
      state.setState(userId, {status: OrderStatus.WELCOME});
      return;
    }

    if (command === ChanelCommands.NOTICE) {
      const orders = await getOrdersData();
      const userOrders = orders.filter((order) => order.user_id === userId && order.event_id === eventId);

      if (userOrders.length === 0) {
        screen.chanelUserHasNoOrders(CHANEL_ID);
        return;
      }

      const event = await getEventData(eventId);

      if (event && event.notice) {
        await screen.userNoticeEvent(userId, event);
        await screen.chanelResponce(CHANEL_ID);
      } else {
        screen.chanelNoEvent(CHANEL_ID);
      }

      return;
    }

    screen.chanelBadRequest(CHANEL_ID);
    return;
  }

  if (query.data === UserCommands.RESET) {
    state.initionlState(chatId);
  }

  logger.info(`${chatId} 'callback_query' ${query.data}`);

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

        const posterPath = path.join(__dirname, '../img', event.poster || '');

        if (event.poster && fs.existsSync(posterPath)) {
          screen.eventWithPoster(chatId, event, posterPath);
        } else {
          screen.event(chatId, event);
        }

      } else {
        // const events = await getEventsData();
        const {events} = state.getState(chatId);
        screen.userListMistake(chatId, events);
      }
      break;
    }


    case OrderStatus.EVENT: {
      if (type === 'callback_query') {
        const {event} = state.getState(chatId);
        const orders = await getOrdersData();

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
            phone: msg.text.replace('+', ''),
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

        addOrdersData([
          chatId,
          msg.from.first_name,
          msg.from.last_name,
          msg.from.username,
          name,
          phone,
          countTicket,
          '', // payment,
          new Date().toLocaleString('ru-RU'),
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
