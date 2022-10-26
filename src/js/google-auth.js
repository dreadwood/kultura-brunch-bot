'use strict';

const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const {google} = require('googleapis');
const {SCOPES} = require('./const');
const readFile = promisify(fs.readFile);

const {CREDENTIALS_FILE} = process.env;

const CREDENTIALS_PATH = path.join(__dirname, '..', '..', CREDENTIALS_FILE);

/**
* Создает клиента для аутентификации с помощью JWT
* в сервисах Google.
* @async
* @returns {Promise<Object>}  google.auth.JWT instance
*/
const getAuthClient = async () => {
  const content = await readFile(CREDENTIALS_PATH)
    .catch((error) => console.log('Error loading client secret file:', error));

  const {client_email , private_key} = JSON.parse(content);

  const client = new google.auth.JWT(
    client_email,
    null,
    private_key,
    SCOPES,
    null,
  );

  return client;
};

module.exports = {
  getAuthClient,
};
