'use strict';

const {google} = require('googleapis');
const {Pages, EventCells, OrderCells} = require('./const');
const {getAuthClient} = require('./google-auth');
const helpers = require('./helpers');

const {SPREADSHEET_ID} = process.env;

const STATUS_CODE_OK = 200;

async function getApiClient() {
  const authClient = await getAuthClient();
  const {spreadsheets: apiClient} = google.sheets({
    version: 'v4',
    auth: authClient,
  });

  return apiClient;
}

// записать данные в таблицу
async function addSheetData(page, data) {
  const apiClient = await getApiClient();

  const res = await apiClient.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${page}`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [data],
    },
  });

  return res.status === STATUS_CODE_OK;
}

// получить данные таблицы
async function getSheetData(page, legendCells, dataCells) {
  const apiClient = await getApiClient();

  const {data: {valueRanges}} = await apiClient.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: [
      `${page}!${legendCells}`,
      `${page}!${dataCells}`,
    ],
  });

  const legend = valueRanges[0].values[0];
  const data = valueRanges[1].values;

  if (!legend || !data) {
    return [];
  }

  return data.map((row) => legend.reduce((acc, _, i) => {
    acc[legend[i]] = row[i] ?? '';
    return acc;
  }, {}));
}

// ===============================================

async function getEventsData() {
  const data = await getSheetData(Pages.EVENTS, EventCells.LEGEND, EventCells.DATA);

  return data.filter((row) => !!row.id && !helpers.isDatePassed(row.date));
}

async function getEventData(eventId) {
  const data = await getEventsData();
  const eventData = data.find((it) => it.id === eventId);

  if (!eventData) {
    return null;
  }

  return eventData;
}

async function getOrdersData() {
  return await getSheetData(Pages.CLIENTS, OrderCells.LEGEND, OrderCells.DATA);
}

function addOrdersData(data) {
  addSheetData(Pages.CLIENTS, data);
}


module.exports = {
  getEventsData,
  getEventData,
  getOrdersData,
  addOrdersData,
};
