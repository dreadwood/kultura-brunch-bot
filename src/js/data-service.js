'use strict';

const {google} = require('googleapis');
const {Pages} = require('./config');
const {getAuthClient} = require('./google-auth');
const {getTitleEventTempale} = require('./templates');

const {SPREADSHEET_ID} = process.env;

const getApiClient = async () => {
  const authClient = await getAuthClient();
  const {spreadsheets: apiClient} = google.sheets({
    version: 'v4',
    auth: authClient,
  });

  return apiClient;
};


const getSheetData = async (apiClient, page, legendCells = '', dataCells = '') => {
  const {data} = await apiClient.get({
    spreadsheetId: SPREADSHEET_ID,
    ranges: [
      `'${page}'${legendCells}`,
      `'${page}'${dataCells}`,
    ],
    fields: 'sheets',
    includeGridData: true,
  });

  return data.sheets;
};


const getRowData = async (page, legendCells, dataCells) => {
  const apiClient = await getApiClient();
  const [sheet] = await getSheetData(apiClient, page, legendCells, dataCells);

  const legend = sheet.data[0].rowData[0].values.map((it) => it.formattedValue);
  const data = sheet.data[1].rowData.reduce((arr, row) => {
    if (!row.values[0].formattedValue) {
      return arr;
    }

    const objRow = row.values.reduce((acc, it, i) => {
      acc[legend[i]] = it.formattedValue;

      return acc;
    }, {});

    arr.push(objRow);

    return arr;
  }, []);

  return data;
};


// TODO: 2022-10-05 / move func
/**
* @async
* @returns {Array.<{text: string, callback_data: string}[]>}
* keyboard with id event
*/
const getEventListKeyboard = (eventsData) => {
  const keyboard = eventsData.map((eventData) => [{
    text: getTitleEventTempale(eventData),
    callback_data: `info-${eventData.id}`,
  }]);

  return keyboard;
};


/**
* @async
* @param {number}
* @returns {Object.<string, string>[]} data event
*/
const getEventsData = async () => {
  const data = await getRowData(Pages.EVENTS, '!A1:L1', '!A3:L9');

  return data;
};


/**
* @async
* @param {number} eventId
* @returns {Object.<string, string>} data event
*/
const getEventData = async (eventId) => {
  const data = await getEventsData();
  const eventData = data.find((it) => it.id === eventId);

  if (!eventData) {
    return [];
  }

  return eventData;
};


/**
* @async
* @param {number}
* @returns {Object.<string, string>[]} data event
*/
const getClientsData = async () => {
  const data = await getRowData(Pages.CLIENTS, '!A1:I1', '!A3:I33');

  return data;
};


module.exports = {
  getEventListKeyboard,
  getEventsData,
  getEventData,
  getClientsData,
};
