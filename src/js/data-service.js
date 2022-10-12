'use strict';

const {google} = require('googleapis');
const {Pages} = require('./const');
const {getAuthClient} = require('./google-auth');

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

  const legend = valueRanges[0].values;
  const data = valueRanges[1].values;

  if (!legend || !data) {
    return [];
  }

  return data.map((row) => row.reduce((acc, cell, i) => {
    acc[legend[0][i]] = cell;
    return acc;
  }, {}));
}

// ===============================================

async function getEventsData() {
  return await getSheetData(Pages.EVENTS, 'A1:L1', 'A3:L9');
}

async function getEventData(eventId) {
  const data = await getEventsData();
  const eventData = data.find((it) => it.id === eventId);

  if (!eventData) {
    return null;
  }

  return eventData;
}

async function getClientsData() {
  return await getSheetData(Pages.CLIENTS, 'A1:J1', 'A3:J33');
}

function addClientsData(data) {
  addSheetData(Pages.CLIENTS, data);
}


module.exports = {
  getEventsData,
  getEventData,
  getClientsData,
  addClientsData,
};
