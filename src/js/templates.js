'use strict';

const welcomeText = `"Здравствуйте!
На какую встречу вы хотите записаться?"`;

function getTitleEventTempale(eventData) {
  return `${eventData.date} / ${eventData.title}`;
}

function getEventTempale(eventData) {
  return `${eventData.description}

📍Встреча начнётся ${eventData.date} в ${eventData.time} в ${eventData.place}

💫 Цена — ${eventData.price} лари. В стоимость входит лекция, завтрак, любой б/а напиток.`;
}

function getPaymentTemplate(price, prepayment) {
  return `Спасибо! Стоимость участия: ${price} gel, В цену входит: билет, еда, лекция, эскурсия.

Для брони места необходимо внести 50% от стоимости билета (${prepayment} gel)
Перевести можно вот сюда (BOG)`;
}

function getAccountNumberTempale() {
  return 'Account number: GE18BG0000000537571285';
}

function getAccountOwnerTempale() {
  return 'Имя: Bykov Sergei';
}

function getRequestReceipTempale() {
  return 'Отправьте, пожалуйста, чек об оплате.';
}

module.exports = {
  welcomeText,
  getTitleEventTempale,
  getEventTempale,
  getPaymentTemplate,
  getAccountNumberTempale,
  getAccountOwnerTempale,
  getRequestReceipTempale,
};
