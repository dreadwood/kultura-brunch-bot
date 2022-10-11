'use strict';

const TelegramBot = require('node-telegram-bot-api');
const {OrderStatus} = require('./const');
const {getEventData, addClientsData, getClientsData} = require('./data-service');
const {
  welcomeScreen,
  eventScreen,
  ticketScreen,
  nameScreen,
  phoneScreen,
  paymentScreen,
  checkScreen,
  doneScreen,
  chanelScreen,
  undoneScreen,
} = require('./screen');
const State = require('./state');
// const {debug} = require('./utils');

const {BOT_TOKEN, CHANEL_ID} = process.env;
const bot = new TelegramBot(BOT_TOKEN, {polling: true});

const state = new State();

// bot.on('message', (msg, metadata) => {});
// bot.on('text', (msg) => {});
// bot.on('callback_query', (query) => {});
// bot.on('contact', (msg) => {});
// bot.on('photo', (msg) => {});
// bot.onText('/\/start/', (msg) => {});

bot.on('message', (msg, metadata) => {
  const chatId = msg.chat.id;

  if (metadata.type === 'text' && (msg.text === '/start' || msg.text === '/reset')) {
    state.initionlState(chatId);
  }

  processRequest(chatId, msg, null, metadata.type);
});


bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  if (chatId === Number(CHANEL_ID)) {
    const userId = query.from.id;
    const buttonQueryData = query.data;

    if (Number(buttonQueryData)) {
      doneScreen(bot, userId);
    } else {
      undoneScreen(bot, userId);
    }

    state.changeStatus(chatId, OrderStatus.WELCOME);

    return;
  }

  processRequest(chatId, null, query, 'callback_query');
});


async function processRequest(chatId, msg, query, type) {
  const status = state.getStatus(chatId);

  switch (status) {
    case OrderStatus.WELCOME: {
      if (type === 'callback_query') {
        const eventId = query.data;
        const event = await getEventData(eventId);

        if (!event) {
          bot.sendMessage(chatId, 'К сожалению, такого мероприятия нет.');
          return;
        }

        state.setEvent(chatId, event);
        state.changeStatus(chatId, OrderStatus.EVENT);

        eventScreen(bot, chatId, event);
      } else {
        welcomeScreen(bot, chatId);
      }

      break;
    }


    case OrderStatus.EVENT: {
      if (type === 'callback_query') {
        const event = state.getEvent(chatId);
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

        ticketScreen(bot, chatId, ticketsOnSale);
        state.changeStatus(chatId, OrderStatus.TICKET);
      } else {
        // никак
      }
      break;
    }


    case OrderStatus.TICKET: {
      if (type === 'text' && !isNaN(Number(msg.text))) {
        const countTicket = msg.text;
        state.setInput(chatId, {countTicket});

        state.changeStatus(chatId, OrderStatus.NAME);
        nameScreen(bot, chatId, countTicket);
      } else {
        const event = state.getEvent(chatId);
        ticketScreen(bot, chatId, event);
      }
      break;
    }


    case OrderStatus.NAME: {
      if (type === 'text') {
        const name = msg.text;
        state.setInput(chatId, {name});
        state.changeStatus(chatId, OrderStatus.PHONE);

        phoneScreen(bot, chatId);
      } else {
        const {countTicket} = state.getInput(chatId);
        nameScreen(bot, chatId, countTicket);
      }
      break;
    }


    case OrderStatus.PHONE: {
      if (type === 'contact') {
        const phone = msg.contact.phone_number;
        state.setInput(chatId, {phone});
        state.changeStatus(chatId, OrderStatus.PAYMENT);

        const event = state.getEvent(chatId);
        paymentScreen(bot, chatId, event);
      } else {
        phoneScreen(bot, chatId);
      }
      break;
    }


    case OrderStatus.PAYMENT: {
      if (type === 'photo' || type === 'document') {
        checkScreen(bot, chatId);
        state.changeStatus(chatId, OrderStatus.CHECK);

        const userInput = state.getInput(chatId);
        const event = state.getEvent(chatId);
        chanelScreen(bot, CHANEL_ID, msg, userInput);

        addClientsData([
          chatId,
          msg.from.first_name, // first
          msg.from.last_name, // last
          msg.from.username, // nick
          userInput.name,
          userInput.phone,
          userInput.countTicket, // ticket
          '', // payment,
          new Date().toLocaleString(), // date
          event.id, // event
        ]);

      } else {
        const event = state.getEvent(chatId);
        paymentScreen(bot, chatId, event);
      }
      break;
    }


    case OrderStatus.CHECK: {
      bot.sendMessage(chatId, 'Мы сейчас проверим чек и отправим вам потвержедние');
      break;
    }


    case OrderStatus.DONE: {
      // doneScreen(bot, chatId);
      // state.changeStatus(chatId, OrderStatus.WELCOME);
      break;
    }

    default: {
      state.initionlState(chatId);
      welcomeScreen(bot, chatId);
      break;
    }
  }
}


// const sendScreen = {
//   [OrderStatus[OrderStatus.SELECT]]: welcomeScreen(),
// };
