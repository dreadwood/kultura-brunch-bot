/**
 * Meta (Facebook) API Conversions
 * https://business.facebook.com/business/help/2041148702652965
 * https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * Business SDK
 * https://developers.facebook.com/docs/marketing-api/conversions-api/guides/business-sdk-features
 *
 * параметры
 * https://developers.facebook.com/docs/marketing-api/conversions-api/parameters
 * параметры: события
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */

'use strict';

const axios = require('axios');
const helpers = require('./helpers');

const {
  META_PIXEL_ID,
  META_ACCESS_TOKEN,
  META_CAPI,
  META_TEST_CODE,
} = process.env;

const city = 'tbilisi';
const county = 'ge';
const currency = 'GEL';
const actionSource = 'chat';

const URL_API = `https://graph.facebook.com/v15.0/${META_PIXEL_ID}/events`;

const sendEventMeta = ({
  eventName,
  userId,
  phone,
  eventId,
  eventTitle,
  price,
  ticket,
}) => {
  if (
    !META_ACCESS_TOKEN
    || !META_PIXEL_ID
    || META_CAPI !== 'true'
  ) {
    return;
  }

  const externalId = typeof userId === 'number' ? userId.toString() : userId;
  const tel = phone ? helpers.normalizePhoneNumber(phone) : null;
  const contentPrice = +price || null;
  const contentQuantity = ticket || 1;
  const currentTimestamp = Math.floor(new Date() / 1000);


  const userData = {
    ct: [helpers.getSHA256Hash(city)],
    country: [helpers.getSHA256Hash(county)],
    external_id: [helpers.getSHA256Hash(externalId)],
  };
  if (tel && tel.length >= 7 && tel.length <= 15) {
    userData.ph = [helpers.getSHA256Hash(tel)];
  }


  const content = {};
  if (eventId) {
    content.id = eventId;
  }
  if (contentPrice) {
    content.item_price = contentPrice;
    content.quantity = contentQuantity;
  }


  const customData = {};
  if (eventTitle) {
    customData.content_name = eventTitle;
  }
  if (eventId) {
    customData.contents = [content];
  }
  if (contentPrice) {
    customData.currency = currency;
    customData.value = contentPrice * contentQuantity;
  }


  const serverEvent = {
    event_name: eventName,
    event_time: currentTimestamp,
    action_source: actionSource,
    user_data: userData,
  };
  if (eventId) {
    serverEvent.custom_data = customData;
  }


  const reqData = {
    data: [serverEvent],
    access_token: META_ACCESS_TOKEN,
  };
  if (META_TEST_CODE) {
    reqData.test_event_code = META_TEST_CODE;
  }


  axios.post(URL_API, reqData, {timeout: 1000})
    // .then((response) => {
    //   console.log(`Status code ${response.status}`);
    //   console.log(response.data);
    // })
    .catch((err) => {
      console.error(`Error: ${err.message}`);
      // console.log(err);
    });
};

module.exports = {
  sendEventMeta,
};
