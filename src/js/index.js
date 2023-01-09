'use strict';

const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const {nanoid} = require('nanoid');
const State = require('./state');
const Screen = require('./screen');
const helpers = require('./helpers');
const {getLogger} = require('./logger');
const {
  REG_EXP_PHONE,
  RUS_LOCAL,
  LENGTH_ORDER_ID,
  OrderStatus,
  // OrderStatusCode,
  ChanelQuery,
  UserQuery,
  UserCommands,
  AdminQuery,
  metaEvent,
} = require('./const');

const {
  getEventData,
  addOrdersData,
  getOrdersData,
  getEventsData,
} = require('./data-service');
const metaCAPI = require('./meta-capi');

const {BOT_TOKEN, CHANEL_ID, ADMINS} = process.env;

const logger = getLogger();
const bot = new TelegramBot(BOT_TOKEN, {polling: true});
const state = new State();
const screen = new Screen(bot);
const admins = ADMINS.split(' ');

bot.setMyCommands([
  UserCommands.START,
  UserCommands.RECEIPT,
]);

logger.info('START BOT');


/**
 * ОТПРАВКА ДАННЫХ (ТЕКСТ, ФОТО, АУДИО И ПРОЧЕЕ)
 */
bot.on('message', (msg, metadata) => {
  const user = msg.from;
  logger.info(`${user.username} ${user.id} '${metadata.type.toUpperCase()}' ${msg.text || ''}`);

  try {
    if (!state.checkState(user.id)) {
      state.initionlState(user);
    }

    if (msg.text === UserCommands.START.command) {
      state.setState(user.id, {status: OrderStatus.BUY_WELCOME});
      metaCAPI.sendEventMeta({
        eventName: metaEvent.VIEW_CONTENT,
        externalId: user.id,
      });
    }

    if (msg.text === UserCommands.RECEIPT.command) {
      state.setState(user.id, {status: OrderStatus.PAYMENT_REQUEST});
    }

    if (msg.text === UserCommands.FEEDBACK.command) {
      state.setState(user.id, {status: OrderStatus.FEEDBACK_REQUEST});
    }

    if (msg.text === UserCommands.ADMIN.command) {
      if (helpers.isAdmin(user.id, admins)) {
        state.setState(user.id, {status: OrderStatus.ADMIN_WELCOME});
      }
    }

    processRequest(user.id, metadata.type, msg, null);
  } catch (err) {
    console.error(new Date(), err);
    state.initionlState(user);
    screen.chanelUnknownError(CHANEL_ID);
    screen.userUnknownError(user.id);
  }
});


/**
 * ЗАПРОСЫ
 */
bot.on('callback_query', async (query) => {
  const chat = query.message.chat;
  const user = query.from;

  /**
   * CHANEL
   */
  try {
    if (chat.id === Number(CHANEL_ID)) {
      logger.info(`'CHANEL' ${user.username} 'QUERY' ${query.data}`);

      const queryJsonData = JSON.parse(query.data);
      chanelProcess(chat.id, query, queryJsonData);
      return;
    }
  } catch (err) {
    logger.error('ERROR');
    console.error(new Date(), err);

    screen.chanelUnknownError(CHANEL_ID);
    return;
  }

  /**
   * BOT
   */
  try {
    logger.info(`${user.username} ${user.id} 'QUERY' ${query.data}`);

    if (!state.checkState(user.id)) {
      state.initionlState(user);
    }

    const queryJsonData = JSON.parse(query.data);

    if (queryJsonData.cmd === UserQuery.RESET) {
      state.setState(user.id, {status: OrderStatus.BUY_WELCOME});
    }

    processRequest(user.id, 'callback_query', null, queryJsonData);
  } catch (err) {
    logger.error('ERROR');
    console.error(new Date(), err);

    state.initionlState(user);
    screen.chanelUnknownError(CHANEL_ID);
    // TODO: 2022-11-04 / temporarily
    // screen.userUnknownError(user.id);
  }
});


/**
 * ОБРАБОТЧИК КАНАЛА
 */
async function chanelProcess(chanelId, query, queryJsonData) {
  const {cmd, orderId} = queryJsonData;
  const adminName = query.from.username;
  const messageId = query.message.message_id;

  const orders = await getOrdersData();
  const userOrder = orders.find((order) => order.order_id === orderId);
  if (!userOrder) {
    screen.chanelUserHasNoOrder(chanelId, adminName);
    return;
  }

  const {user_id: userId, username: userName} = userOrder;
  const event = await getEventData(userOrder.event_id);
  /**
   * FIXME:
   * 2022-12-11 времено
   * убрать проверку на запрос из условия
   * сейчас getEventData не возвращает прошедшие события
   * поэтому невозможно получить отзыв если событие прошло
   */
  if (cmd !== ChanelQuery.REVIEW && !event) {
    screen.chanelNoEvent(chanelId, adminName);
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


    case ChanelQuery.REVIEW: {
      state.setState(userId, {status: OrderStatus.FEEDBACK_REQUEST, userName, orderId});
      await screen.userGetReview(userId);
      screen.chanelGetUserReview(chanelId, adminName, userOrder);
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
async function processRequest(chatId, type, msg, queryJsonData) {
  const stateUser = state.getState(chatId);

  switch (stateUser.status) {
    case OrderStatus.BUY_WELCOME: {
      const events = await getEventsData();

      if (!events.length) {
        screen.userNoEvents(chatId);
        return;
      }

      screen.userList(chatId, events);

      state.setState(chatId, {status: OrderStatus.BUY_LIST});
      break;
    }


    case OrderStatus.BUY_LIST: {
      if (type !== 'callback_query') {
        const events = await getEventsData();
        screen.userList(chatId, events, {repeat: true});
        return;
      }

      const {cmd, eventId} = queryJsonData;

      if (cmd !== UserQuery.SELECT) {
        const events = await getEventsData();
        screen.userList(chatId, events, {repeat: true});
        return;
      }

      const event = await getEventData(eventId);

      if (!event) {
        screen.userEventNotFound(chatId);
        return;
      }

      const posterPath = path.join(__dirname, '../img', event.poster || ''); // FIXME:

      if (event.poster && fs.existsSync(posterPath)) {
        screen.userEventPoster(chatId, event, posterPath);
      } else {
        screen.userEvent(chatId, event);
      }

      state.setState(chatId, {
        event,
        status: OrderStatus.BUY_EVENT,
      });

      break;
    }


    case OrderStatus.BUY_EVENT: {
      if (type !== 'callback_query') {
        screen.userEventAnother(chatId);
        return;
      }

      const {cmd} = queryJsonData;

      if (cmd !== UserQuery.BUY) {
        screen.userEventAnother(chatId);
        return;
      }

      const {event} = stateUser;
      const orders = await getOrdersData();

      const ordersEvent = orders.filter((order) => helpers.isSameId(order.event_id, event.id));
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
        status: OrderStatus.BUY_TICKET,
      });
      metaCAPI.sendEventMeta({
        eventName: metaEvent.INITIATE_CHECKOUT,
        externalId: chatId,
        eventId: event.id,
        eventTitle: event.title,
      });

      break;
    }


    case OrderStatus.BUY_TICKET: {
      const {ticketsOnSale, startSessionTime} = stateUser;

      // TODO: 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.setState(chatId, {status: OrderStatus.BUY_WELCOME});
        return;
      }

      if (type !== 'text') {
        screen.userTicket(chatId, ticketsOnSale);
        return;
      }

      const enterNumber = Number(msg.text);

      if (isNaN(enterNumber)) {
        screen.userTicket(chatId, ticketsOnSale);
        return;
      }

      if (enterNumber > ticketsOnSale || enterNumber < 1) {
        screen.userTicketSoMany(chatId, ticketsOnSale);
      } else {
        screen.userName(chatId, enterNumber);
        state.setState(chatId, {
          countTicket: enterNumber,
          status: OrderStatus.BUY_NAME,
        });
      }

      break;
    }


    case OrderStatus.BUY_NAME: {
      const {startSessionTime, countTicket} = stateUser;

      // TODO: 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.setState(chatId, {status: OrderStatus.BUY_WELCOME});
        return;
      }

      if (type === 'text') {
        state.setState(chatId, {
          name: msg.text,
          status: OrderStatus.BUY_PHONE,
        });

        screen.userPhone(chatId);
      } else {
        screen.userName(chatId, countTicket);
      }
      break;
    }


    case OrderStatus.BUY_PHONE: {
      const {startSessionTime, event, countTicket} = stateUser;

      // TODO 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.setState(chatId, {status: OrderStatus.BUY_WELCOME});
        return;
      }

      if (type === 'text') {

        if (msg.text.match(REG_EXP_PHONE)) {
          const orderId = nanoid(LENGTH_ORDER_ID);

          state.setState(chatId, {
            orderId,
            startSessionTime: Date.now(),
            phone: msg.text.replace(/[^0-9]/g, ''),
            userName: msg.from.username,
            status: OrderStatus.BUY_PAYMENT,
          });

          metaCAPI.sendEventMeta({
            eventName: metaEvent.ADD_TO_CART,
            externalId: chatId,
            eventId: event.id,
            eventTitle: event.title,
            phone: msg.text,
            fullPrice: event.full_price,
            ticket: countTicket,
          });

          screen.userPayment(chatId, event, countTicket);
        } else {
          screen.userPhone(chatId, {repeat: true});
        }

      } else {
        screen.userPhone(chatId);
      }
      break;
    }


    case OrderStatus.BUY_PAYMENT: {
      const {startSessionTime} = stateUser;

      // TODO: 2022-10-13 / refactor
      if (helpers.isSessionTimeUp(startSessionTime)) {
        screen.userTimeUp(chatId);
        state.setState(chatId, {status: OrderStatus.BUY_WELCOME});
        return;
      }

      if (type === 'callback_query') {
        const {cmd} = queryJsonData;

        if (cmd === UserQuery.RETURN_POLICY) {
          screen.userReturnPolicy(chatId);
          return;
        }
      }

      // добавить таймер для оплаты (10 минут), если не успел отправляет сообщение
      // добавить статус "времено забронено"
      if (type === 'photo' || type === 'document') {
        screen.userCheck(chatId);
        state.setState(chatId, {status: OrderStatus.BUY_WELCOME});

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

        metaCAPI.sendEventMeta({
          eventName: metaEvent.PURCHASE,
          externalId: chatId,
          eventId: stateUser.event.id,
          eventTitle: stateUser.event.title,
          phone: stateUser.phone,
          price: stateUser.event.full_price,
          ticket: stateUser.countTicket,
        });

        return;
      }

      screen.userPayment(chatId, null, null, {repeat: true});
      break;
    }


    case OrderStatus.PAYMENT_REQUEST: {
      screen.userPaymentRequest(chatId);

      state.setState(chatId, {status: OrderStatus.PAYMENT_RECEIPT});
      break;
    }


    case OrderStatus.PAYMENT_RECEIPT: {
      if (type === 'photo' || type === 'document') {
        await screen.chanelPaymentReceipt(CHANEL_ID, chatId, msg);
        await screen.chanelPaymentData(CHANEL_ID, stateUser);
        await screen.userPaymentDone(chatId);
        state.setState(chatId, {status: OrderStatus.BUY_WELCOME});

        return;
      }

      screen.userPaymentRequest(chatId);
      break;
    }


    case OrderStatus.FEEDBACK_REQUEST: {
      await screen.chanelFeedbackData(CHANEL_ID, stateUser);
      await screen.chanelFeedbackMessage(CHANEL_ID, chatId, msg);
      await screen.userFeedbackThanks(chatId);

      state.setState(chatId, {status: OrderStatus.BUY_WELCOME});
      break;
    }


    case OrderStatus.ADMIN_WELCOME: {
      if (type !== 'callback_query') {
        screen.adminWelcome(chatId);
        return;
      }

      const {cmd} = queryJsonData;

      if (cmd === AdminQuery.TICKET) {
        const events = await getEventsData();

        if (!events.length) {
          screen.adminNoEvents(chatId);
          return;
        }

        const orders = await getOrdersData();

        orders.forEach((order) => events.forEach((event) => {
          if (helpers.isSameId(event.id, order.event_id)) {
            event.available = event.available
              ? event.available - Number(order.ticket)
              : event.capacity - Number(order.ticket);
          }
        }));

        screen.adminTicket(chatId, events);
      }

      if (cmd === AdminQuery.LIST) {
        const events = await getEventsData();

        if (!events.length) {
          screen.adminNoEvents(chatId);
          return;
        }

        const orders = await getOrdersData();

        // TODO: 2023-01-07 / move to other function
        const eventsWithContacts = events.reduce((accEvents, event) => {

          // TODO: 2023-01-07 / move to other function
          const eventWithContacts = orders.reduce((accOrders, order) => {
            if (helpers.isSameId(event.id, order.event_id)) {
              accOrders.persons.push({
                name: order.name,
                ticket: order.ticket,
                phone: order.phone,
                username: order.username,
                userId: order.user_id,
              });
            }

            return accOrders;
          }, {title: event.title, persons: []});

          if (eventWithContacts.persons.length !== 0) {
            accEvents.push(eventWithContacts);
          }

          return accEvents;
        }, []);

        screen.adminList(chatId, eventsWithContacts);
      }

      if (cmd === AdminQuery.MESSAGE) {
        screen.adminMessageRequestId(chatId);
        state.setState(chatId, {status: OrderStatus.ADMIN_MESSAGE_ID});
      }
      break;
    }


    case OrderStatus.ADMIN_MESSAGE_ID: {
      const enterId = Number(msg.text);

      if (isNaN(enterId)) {
        screen.adminMessageRequestId(chatId);
        return;
      }

      screen.adminMessageRequestText(chatId);

      state.setState(chatId, {
        userIdMessage: enterId,
        status: OrderStatus.ADMIN_MESSAGE_TEXT,
      });
      break;
    }


    case OrderStatus.ADMIN_MESSAGE_TEXT: {
      if (type !== 'text') {
        screen.adminMessageRequestText(chatId);
        return;
      }

      const {userIdMessage} = stateUser;

      try {
        await screen.userAdminMessage(userIdMessage, msg.text);
        screen.adminMessageDone(chatId);
        screen.chanelAdminUserMsg(CHANEL_ID, userIdMessage, msg);
        state.setState(chatId, {status: OrderStatus.ADMIN_WELCOME});
      } catch (err) {
        screen.adminMessageError(CHANEL_ID);
        console.error(new Date(), err.code, err.response?.body?.description);
      }
      break;
    }

  }
}
