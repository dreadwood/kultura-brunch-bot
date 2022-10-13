'use strict';

const path = require('path');
const pino = require('pino');
const {
  LOG_FILE,
  DEFAULT_LOG_LEVEL,
} = require('./const');

const LOG_PATH = path.join(__dirname, '..', '..', 'logs', LOG_FILE);

const logger = pino(
  {
    level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'SYS:dd-mm-yy HH:MM:ss',
        ignore: 'pid,hostname',
        destination: LOG_PATH,
        colorize: false,
        singleLine: true,
      },
    },
  },
);

module.exports = {
  getLogger(options = {}) {
    return logger.child(options);
  },
};
