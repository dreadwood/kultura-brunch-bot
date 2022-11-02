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

  // TODO: 2022-11-01 / убрать несколько JSON.parse
  const {cmd} = JSON.parse(query.data);
  if (cmd === UserQuery.RESET) {
    state.setState(user.id, {status: OrderStatus.WELCOME});
  }

  // TODO: 2022-11-02 / вверх и добавить чат
  logger.info(`${user.username} 'QUERY' ${query.data}`);
  processRequest(user.id, null, query, 'callback_query');
});


/**
 * ОБРАБОТЧИК КАНАЛА
 */
async function chanelProcess(chanelId, query) {
  const {cmd, orderId} = JSON.parse(query.data);
  const adminName = query.from.username;
  const messageId = query.message.message_id;

  const orders = await getOrdersData();
  const userOrder = orders.find((order) => order.order_id === orderId);
  if (!userOrder) {
    screen.chanelUserHasNoOrder(chanelId, adminName);
    return;
  }

  const {user_id: userId} = userOrder;
  const event = await getEventData(userOrder.event_id);
  if (!event) {
    screen.chanelNoEvent(chanelId);
    return;
  }

  switch (cmd) {
    case ChanelQuery.CONFIRM: {
      await screen.userDone(userId, event);
      await screen.chanelUserDataNotice(chanelId, messageId, adminName, userOrder);
      break;
    }


    case ChanelQuery.REJECT: {
      await screen.userUndone(userId, event);
      await screen.chanelUserDataReject(chanelId, messageId, adminName, userOrder);
      break;
    }


    case ChanelQuery.NOTICE: {
      if (event.notice) {
        await screen.userNoticeEvent(userId, event);
        screen.chanelUserDataNoticeRepeat(chanelId, messageId, adminName, userOrder);
      } else {
        screen.chanelNoNotice(chanelId);
      }
      break;
    }


    default: {
      screen.chanelBadRequest(chanelId, adminName);
      break;
    }
  }
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
        const {cmd, eventId} = JSON.parse(query.data);

        if (cmd === UserQuery.SELECT) {
          const event = await getEventData(eventId);

          if (!event) {
            screen.userEventNotFound(chatId);
            return;
          }

          const posterPath = path.join(__dirname, '../img', event.poster || '');

          if (event.poster && fs.existsSync(posterPath)) {
            screen.eventWithPoster(chatId, event, posterPath);
          } else {
            screen.event(chatId, event);
          }

          state.setState(chatId, {
            event,
            status: OrderStatus.EVENT,
          });
        }

      } else {
        const events = await getEventsData();
        screen.userListMistake(chatId, events);
      }
      break;
    }


    case OrderStatus.EVENT: {
      if (type === 'callback_query') {
        const {cmd} = JSON.parse(query.data);

        if (cmd === UserQuery.BUY) {
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
        }
      } else {
        screen.eventMistake(chatId);
      }
      break;
    }


    case OrderStatus.TICKET: {
      const {ticketsOnSale, startSessionTime} = stateUser;

      // TODO: 2022-10-13 / refactor
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

      // TODO: 2022-10-13 / refactor
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
          const orderId = nanoid(LENGTH_ORDER_ID);

          state.setState(chatId, {
            orderId,
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

      // TODO: 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.setState(chatId, {status: OrderStatus.WELCOME});
        return;
      }

      if (type === 'callback_query') {
        const {cmd} = JSON.parse(query.data);

        if (cmd === UserQuery.RETURN_POLICY) {
          screen.userReturnPolicy(chatId);
        }

        return;
      }

      // добавить таймер для оплаты (10 минут), если не успел отправляет сообщение
      // добавить статус "времено забронено"
      if (type === 'photo' || type === 'document') {
        screen.check(chatId);
        state.setState(chatId, {status: OrderStatus.WELCOME});

        await screen.chanelReceipt(CHANEL_ID, chatId, msg);
        screen.chanelUserDataCheck(CHANEL_ID, stateUser);

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
          stateUser.orderId,
          // OrderStatusCode.pending,
        ]);

        return;
      }

      screen.paymentMistake(chatId);
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
        state.setState(chatId, {status: OrderStatus.WELCOME});
      }

      break;
    }
  }
}
