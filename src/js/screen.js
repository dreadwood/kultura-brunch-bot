'use strict';

const {getEventListKeyboard, getEventsData} = require('./data-service');
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

  await bot.sendPhoto(chatId, event.poster, {
    caption: eventText,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'купить билиет',
            callback_data: `buy-${event.id}`,
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


function ticketScreen(bot, chatId, event) {
  bot.sendMessage(chatId, `Сколько вам билетов? Отправте число от 1 до ${event.capacity}`);
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


function contactRequestScreen(bot, chatId, ticketCount) {
  bot.sendMessage(chatId, `Вы выбрали ${ticketCount} билетов. Напишите, пожалуйста, ваше имя и номер телефона`, {
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


module.exports = {
  welcomeScreen,
  eventScreen,
  ticketScreen,
  nameScreen,
  phoneScreen,
  paymentScreen,
  checkScreen,
  doneScreen,


  contactRequestScreen,
};
