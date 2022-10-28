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
  RUS_LOCAL,
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

/**
 * ОТПРАВКА ДАННЫХ
 */
bot.on('message', (msg, metadata) => {
  const chatId = msg.chat.id;

  logger.info(`${chatId} '${metadata.type}' ${msg.text || ''}`);

  if (msg.text === '/start') {
    state.initionlState(chatId);
  }

  processRequest(chatId, msg, null, metadata.type);
});

/**
 * ЗАПРОСЫ
 */
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (chatId === Number(CHANEL_ID)) {
    const [userId, userName, eventId, command] = query.data.split('_');
    const adminName = query.from.username;
    const messageId = query.message.message_id;

    const stateUser = state.getState(userId);

    logger.info(`${CHANEL_ID} 'callback_query' ${query.data}`);

    if (stateUser?.status === OrderStatus.CHECK) {

      if (command === ChanelCommands.CONFIRM) {
        await screen.userDone(userId);
        await screen.chanelDone(CHANEL_ID, adminName, userName);
        await screen.chanelUserDataNotice(CHANEL_ID, userId, messageId, stateUser);
      }

      if (command === ChanelCommands.REJECT) {
        await screen.userUndone(userId);
        await screen.chanelUndone(CHANEL_ID, adminName, userName);
        await screen.chanelUserDataReject(CHANEL_ID, messageId, stateUser);
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
        await screen.chanelNoticeEvent(CHANEL_ID, adminName, userName);
        await screen.chanelUserDataNoticeRepeat(CHANEL_ID, userId, messageId, stateUser);
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

/**
 * ОБРАБОТЧИК
 */
async function processRequest(chatId, msg, query, type) {
  if (!state.checkState(chatId)) {
    state.initionlState(chatId);
  }

  const stateUser = state.getState(chatId);

  switch (stateUser.status) {
    case OrderStatus.WELCOME: {
      const events = await getEventsData();

      if (!events.length) {
        screen.userNoEvents(chatId);
        return;
      }

      state.setState(chatId, {status: OrderStatus.LIST});

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
      const {startSessionTime} = stateUser;

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
      const {startSessionTime, event} = stateUser;

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

        const {event, name, userName, phone, countTicket} = stateUser;

        await screen.chanelReceipt(CHANEL_ID, chatId, msg);
        screen.chanelUserDataCheck(CHANEL_ID, chatId, stateUser);

        addOrdersData([
          chatId,
          msg.from.first_name,
          msg.from.last_name,
          userName,
          name,
          phone,
          countTicket,
          '', // payment,
          new Date().toLocaleString(RUS_LOCAL),
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
