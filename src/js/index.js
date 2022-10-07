'use strict';

const TelegramBot = require('node-telegram-bot-api');
const {OrderStatus} = require('./const');
const {getEventData} = require('./data-service');
const {welcomeScreen, eventScreen, ticketScreen, nameScreen, phoneScreen, paymentScreen, checkScreen, doneScreen} = require('./screen');
const State = require('./state');
// const {debug} = require('./utils');

const {TOKEN} = process.env;
const bot = new TelegramBot(TOKEN, {polling: true});

const state = new State();

bot.on('message', (msg, metadata) => {
  console.log(msg);
  console.log(`Type is ${metadata.type}`);
});

bot.on('text', async (msg) => {
  const chatId = msg.chat.id;
  state.checkUser(chatId);

  // запуск бота
  if (msg.text === '/start') {
    welcomeScreen(bot, chatId);
    return;
  }


  if (!isNaN(Number(msg.text))) {
    // NAME
    state.changeStatus(chatId, OrderStatus.NAME);
    nameScreen(bot, chatId, msg.text);
  } else {
    // PHONE
    state.changeStatus(chatId, OrderStatus.PHONE);
    phoneScreen(bot, chatId);
  }


  // if (msg.text === '/start') {
  //   const keyboard = await getEventListKeyboard();

  //   bot.sendMessage(chatId, welcomeText, {
  //     reply_markup: {
  //       inline_keyboard: keyboard,
  //     },
  //   });
  // }

});


bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const [typeQuery, dataQuery] = query.data.split('-');


  // EVENT
  if (typeQuery === 'info') {
    const event = await getEventData(dataQuery); // eventId
    state.setEvent(chatId, event);
    state.changeStatus(chatId, OrderStatus.EVENT);

    eventScreen(bot, chatId, event);
  }


  // TICKET
  if (typeQuery === 'buy') {
    const event = state.getEvent(chatId);
    state.changeStatus(chatId, OrderStatus.TICKET);

    ticketScreen(bot, chatId, event);
  }


  // сбрасывает в первоначальное состояние
  if (typeQuery === 'inition_state') {
    state.changeStatus(chatId, OrderStatus.SELECT);
    welcomeScreen(bot, chatId);
  }
});


// PAYMENT
bot.on('contact', (msg) => {
  const chatId = msg.chat.id;
  const event = state.getEvent(chatId);

  state.changeStatus(chatId, OrderStatus.PAYMENT);
  paymentScreen(bot, chatId, event);
});


// CHECK
bot.on('photo', (msg) => {
  // получть изображение, добавить document
  const chatId = msg.chat.id;
  // console.log(msg);

  const photo = msg.photo[msg.photo.length - 1];
  bot.sendMessage(chatId, `Вы отправили фотографию в ${new Date()} / размеры ${photo.width} и ${photo.height}`);

  // changeStatus(chatId, OrderStatus.CHECK);
  checkScreen(bot, chatId);


  setTimeout(() => {
    doneScreen(bot, chatId);
  }, 4000);
});
