/* eslint-disable camelcase */
'use strict';

const path = require('path');
const {getEventsData} = require('./data-service');
const {getEventListKeyboard} = require('./keyboard');
const {welcomeText, getPaymentTemplate, getAccountOwnerTempale, getAccountNumberTempale, getRequestReceipTempale, getEventTempale} = require('./templates');


async function welcomeScreen(bot, chatId) {
  const eventsData = await getEventsData();
  const keyboard = getEventListKeyboard(eventsData);

  bot.sendMessage(chatId, welcomeText, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
}


async function eventScreen(bot, chatId, event) {
  const eventText = getEventTempale(event);
  const posterPath = path.join(__dirname, '..', 'img', event.poster);

  await bot.sendPhoto(chatId, posterPath, {
    caption: eventText,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'купить билиет',
            callback_data: event.id,
          },
        ],
        [
          {
            text: 'вернуться назад',
            callback_data: 'inition_state',
          },
        ],
      ],
    },
  });
}


function ticketScreen(bot, chatId, ticket) {
  bot.sendMessage(chatId, `Сколько вам билетов? Отправте число от 1 до ${ticket}`);
}


function nameScreen(bot, chatId, selectedTickets) {
  bot.sendMessage(chatId, `Вы выбрали ${selectedTickets} билетов. Напишите, пожалуйста, ваше имя`);
}


function phoneScreen(bot, chatId) {
  bot.sendMessage(chatId, 'Для бронирования оставьте свой номер телефона', {
    reply_markup: {
      keyboard: [
        [{
          text: 'оставить номер телефона',
          request_contact: true,
        }],
        [{
          text: 'вернуться назад',
          callback_data: 'inition_state',
        }],
      ],
      one_time_keyboard: true,
    },
  });
}


async function paymentScreen(bot, chatId, event) {
  await bot.sendMessage(chatId, getPaymentTemplate(event.price, event.prepayment));
  await bot.sendMessage(chatId, getAccountNumberTempale());
  await bot.sendMessage(chatId, getAccountOwnerTempale());
  bot.sendMessage(chatId, getRequestReceipTempale());
}


function checkScreen(bot, chatId) {
  bot.sendMessage(chatId, 'Спасибо! Мы забронировали за вами места. В ближайшее время мы проверим оплату.');
}

function doneScreen(bot, chatId) {
  bot.sendMessage(chatId, 'Поздравляем оплата прошла. Мы ждем вас [дополнительная информация].');
}

function undoneScreen(bot, chatId) {
  bot.sendMessage(chatId, 'Почему-то мы не видем вашей оплаты. Прошу связаться с @dreadwood');
}

async function chanelScreen(bot, chanelId, msg, userInput) {
  const {message_id, from: {id, first_name, last_name, username}} = msg;
  const {name, phone, countTicket} = userInput;

  await bot.forwardMessage(chanelId, id, message_id);
  await bot.sendMessage(chanelId, `${name}\n${phone}
Колличество билетов: ${countTicket}`);

  await bot.sendMessage(chanelId, `id: ${id}
first name: ${first_name}
last name: ${last_name || ''}
username: ${username}`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'потвердить',
            callback_data: 1,
          },
          {
            text: 'не ок',
            callback_data: 0,
          },
        ],
      ],
    },
  });
}


module.exports = {
  welcomeScreen,
  eventScreen,
  ticketScreen,
  nameScreen,
  phoneScreen,
  paymentScreen,
  checkScreen,
  doneScreen,
  undoneScreen,
  chanelScreen,
};
