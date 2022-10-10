'use strict';

const TelegramBot = require('node-telegram-bot-api');
const {OrderStatus} = require('./const');
const {getEventData} = require('./data-service');
const {
  welcomeScreen,
  eventScreen,
  ticketScreen,
  nameScreen,
  phoneScreen,
  paymentScreen,
  checkScreen,
  doneScreen,
} = require('./screen');
const State = require('./state');
// const {debug} = require('./utils');

const {TOKEN} = process.env;
const bot = new TelegramBot(TOKEN, {polling: true});

const state = new State();

// bot.on('message', (msg, metadata) => {});
// bot.on('text', (msg) => {});
// bot.on('callback_query', (query) => {});
// bot.on('contact', (msg) => {});
// bot.on('photo', (msg) => {});
// bot.onText('/\/start/', (msg) => {})

bot.on('message', (msg, metadata) => {
  console.log(metadata);

  const chatId = msg.chat.id;
  processRequest(chatId, msg, null, metadata.type);
});


bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  processRequest(chatId, null, query, 'callback_query');
});


async function processRequest(chatId, msg, query, type) {
  const status = state.getStatus(chatId);

  switch (status) {
    case OrderStatus.WELCOME: {
      if (type === 'callback_query') {
        const eventId = query.data;
        bot.sendMessage(chatId, eventId);
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
        state.changeStatus(chatId, OrderStatus.TICKET);

        ticketScreen(bot, chatId, event);
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
      } else {
        const event = state.getEvent(chatId);
        paymentScreen(bot, chatId, event);
      }
      break;
    }


    case OrderStatus.CHECK: {
      bot.sendMessage(chatId, 'Мы сейчас проверим чек и отправим вам потвержедние');
      state.changeStatus(chatId, OrderStatus.DONE);
      break;
    }


    case OrderStatus.DONE: {
      doneScreen(bot, chatId);
      state.changeStatus(chatId, OrderStatus.WELCOME);
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
