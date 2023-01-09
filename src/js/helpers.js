'use strict';

const crypto = require('crypto');
const {TIME_SESSION} = require('./const');

module.exports = {
  /**
  * Определяет прошло ли время сессии
  * @param {number} startSessionTime
  * @returns {boolean}
  */
  isSessionTimeUp(startSessionTime) {
    return Date.now() - startSessionTime > TIME_SESSION;
  },

  /**
  * Определяет прошла ли указаная дата
  * @param {boolean} date exam 22.10.2022
  * @returns {boolean}
  */
  isDatePassed(date) {
    const MS_IN_DAY = 86400000;
    return Date.parse(date.split('.').reverse().join('-')) + MS_IN_DAY < Date.now();
  },

  /**
  * Определяет администратора
  * @param {number} userId
  * @param {string[]} admins
  * @returns {boolean}
  */
  isAdmin(userId, admins) {
    return admins.includes(userId.toString());
  },

  /**
  * Определяет одинаковые id
  * @param {string} firstId
  * @param {string} secondId
  * @returns {boolean}
  */
  isSameId(firstId, secondId) {
    return firstId.trim() === secondId.trim();
  },

  /**
  * Определяеть форму существительного взависимости от числа
  * @param {string} n number
  * @param {[string, string, string]} words
  * @returns {string}
  */
  declOfNum(n, words) {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) { return words[2]; }
    if (n1 > 1 && n1 < 5) { return words[1]; }
    if (n1 === 1) { return words[0]; }
    return words[2];
  },

  /**
  * Убирает символы, буквы и начальные нули в номере телефона
  * @param {number} phoneNumber
  * @returns {string}
  */
  normalizePhoneNumber(phoneNumber) {
    return phoneNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');
  },

  /**
  * Хэширует строку с использованием функции SHA256
  * @param {string} inputString
  * @returns {string}
  */
  getSHA256Hash(inputString) {
    return crypto.createHash('sha256').update(inputString).digest('hex');
  },
};
