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
  REG_EXP_PHONE,
  RUS_LOCAL,
  // OrderStatusCode,
  ChanelQuery,
  UserQuery,
  UserCommands,
  LENGTH_ORDER_ID,
} = require('./const');
const {
  getEventData,
  addOrdersData,
  getOrdersData,
  getEventsData,
} = require('./data-service');
const {nanoid} = require('nanoid');

const {BOT_TOKEN, CHANEL_ID} = process.env;

const logger = getLogger({name: 'commd'});
const bot = new TelegramBot(BOT_TOKEN, {polling: true});
const state = new State();
const screen = new Screen(bot);

bot.setMyCommands([
  UserCommands.START,
  UserCommands.RECEIPT,
]);

logger.info('START BOT');


/**
 * ОТПРАВКА ДАННЫХ
 */
bot.on('message', (msg, metadata) => {
  const user = msg.from;

  if (!state.checkState(user.id)) {
    state.initionlState(user);
  }

  if (msg.text === UserCommands.START.command) {
    state.setState(user.id, {status: OrderStatus.WELCOME});
  }

  if (msg.text === UserCommands.RECEIPT.command) {
    state.setState(user.id, {status: OrderStatus.PAYMENT_RECEIPT_REQUEST});
  }

  logger.info(`${user.username} '${metadata.type.toUpperCase()}' ${msg.text || ''}`);
  processRequest(user.id, msg, null, metadata.type);
});


/**
 * ЗАПРОСЫ
 */
bot.on('callback_query', async (query) => {
  const chat = query.message.chat;
  const user = query.from;

  if (chat.id === Number(CHANEL_ID)) {
    chanelProcess(chat.id, query);
    return;
  }

  if (!state.checkState(user.id)) {
    state.initionlState(user);
  }

  // TODO: 2022-10-31 / is this work?
  if (query.data === UserQuery.RESET) {
    state.setState(user.id, {status: OrderStatus.WELCOME});
  }

  logger.info(`${user.username} 'QUERY' ${query.data}`);
  processRequest(user.id, null, query, 'callback_query');
});


/**
 * ОБРАБОТЧИК КАНАЛА
 */
async function chanelProcess(chanelId, query) {
  const [userId, userName, eventId, command] = query.data.split('_');
  const adminName = query.from.username;
  const messageId = query.message.message_id;

  const stateUser = state.getState(userId);

  logger.info(`${chanelId} 'QUERY' ${query.data}`);

  // TODO: 2022-10-29 / убрать обращение к стейту
  if (stateUser?.status === OrderStatus.CHECK) {

    if (command === ChanelQuery.CONFIRM) {
      await screen.userDone(userId);
      await screen.chanelDone(chanelId, adminName, userName);
      await screen.chanelUserDataNotice(chanelId, userId, messageId, stateUser);
    }

    if (command === ChanelQuery.REJECT) {
      await screen.userUndone(userId);
      await screen.chanelUndone(chanelId, adminName, userName);
      await screen.chanelUserDataReject(chanelId, messageId, stateUser);
    }

    // change inition state
    state.setState(userId, {status: OrderStatus.WELCOME});
    return;
  }

  if (command === ChanelQuery.NOTICE) {
    const orders = await getOrdersData();
    const userOrders = orders.filter((order) => order.user_id === userId && order.event_id === eventId);

    if (userOrders.length === 0) {
      screen.chanelUserHasNoOrders(chanelId);
      return;
    }

    const event = await getEventData(eventId);

    if (event && event.notice) {
      await screen.userNoticeEvent(userId, event);
      await screen.chanelNoticeEvent(chanelId, adminName, userName);
      await screen.chanelUserDataNoticeRepeat(chanelId, userId, messageId, stateUser);
    } else {
      screen.chanelNoEvent(chanelId);
    }

    return;
  }

  screen.chanelBadRequest(chanelId);
}


/**
 * ОБРАБОТЧИК ПОЛЬЗОВАТЕЛЯ
 */
async function processRequest(chatId, msg, query, type) {
  const stateUser = state.getState(chatId);

  switch (stateUser.status) {
    case OrderStatus.WELCOME: {
      const events = await getEventsData();

      if (!events.length) {
        screen.userNoEvents(chatId);
        return;
      }

      screen.welcome(chatId, events);

      state.setState(chatId, {status: OrderStatus.LIST});
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
        const events = await getEventsData();
        screen.userListMistake(chatId, events);
      }
      break;
    }


    case OrderStatus.EVENT: {
      if (type === 'callback_query') {
        const {event} = stateUser;
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
      const {ticketsOnSale, startSessionTime} = stateUser;

      // TODO 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.setState(chatId, {status: OrderStatus.WELCOME});
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
      const {startSessionTime} = stateUser;

      // TODO 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.setState(chatId, {status: OrderStatus.WELCOME});
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
      const {startSessionTime, event} = stateUser;

      // TODO 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.setState(chatId, {status: OrderStatus.WELCOME});
        return;
      }

      if (type === 'text') {

        if (msg.text.match(REG_EXP_PHONE)) {
          state.setState(chatId, {
            startSessionTime: Date.now(),
            phone: msg.text.replace('+', ''),
            userName: msg.from.username,
            status: OrderStatus.PAYMENT,
          });

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
      const {startSessionTime} = stateUser;

      // TODO 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.setState(chatId, {status: OrderStatus.WELCOME});
        return;
      }

      if (type === 'callback_query' && query.data === UserQuery.RETURN_POLICY) {
        screen.userReturnPolicy(chatId);
        return;
      }

      // добавить таймер для оплаты (10 минут), если не успел отправляет сообщение
      // добавить статус "времено забронено"
      if (type === 'photo' || type === 'document') {
        screen.check(chatId);
        state.setState(chatId, {status: OrderStatus.CHECK});

        await screen.chanelReceipt(CHANEL_ID, chatId, msg);
        screen.chanelUserDataCheck(CHANEL_ID, chatId, stateUser);

        addOrdersData([
          chatId,
          msg.from.first_name,
          msg.from.last_name,
          stateUser.userName,
          stateUser.name,
          stateUser.phone,
          stateUser.countTicket,
          '', // payment,
          new Date().toLocaleString(RUS_LOCAL),
          stateUser.event.id,
          nanoid(LENGTH_ORDER_ID),
          // OrderStatusCode.pending,
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


    case OrderStatus.PAYMENT_RECEIPT_REQUEST: {
      screen.userPaymentRequest(chatId);

      state.setState(chatId, {status: OrderStatus.PAYMENT_DONE});
      break;
    }


    case OrderStatus.PAYMENT_DONE: {
      if (type === 'photo' || type === 'document') {
        await screen.chanelPaymentReceipt(CHANEL_ID, chatId, msg);
        await screen.chanelPaymentData(CHANEL_ID, stateUser);
        await screen.userPaymentDone(chatId);
        // TODO: 2022-10-31 / needed?
        state.setState(chatId, {status: OrderStatus.WELCOME});
      }

      break;
    }
  }
}
