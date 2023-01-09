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

const bizSdk = require('facebook-nodejs-business-sdk');
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

const Content = bizSdk.Content;
const CustomData = bizSdk.CustomData;
const EventRequest = bizSdk.EventRequest;
const UserData = bizSdk.UserData;
const ServerEvent = bizSdk.ServerEvent;

bizSdk.FacebookAdsApi.init(META_ACCESS_TOKEN);

const sendEventMeta = ({
  eventName,
  externalId,
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

  const tel = phone ? helpers.normalizePhoneNumber(phone) : null;
  const contentPrice = +price || null;
  const contentQuantity = ticket || 1;
  const currentTimestamp = Math.floor(new Date() / 1000);


  const userData = (new UserData())
    .setCity(city)
    .setCountry(county) // ISO 3166-1 alpha-2
    .setExternalId(externalId);
  if (tel && tel.length >= 7 && tel.length <= 15) {userData.setPhone(tel);}


  const content = new Content();
  if (eventId) {content.setId(eventId);}
  if (contentPrice) {
    content
      .setItemPrice(contentPrice)
      .setQuantity(contentQuantity);
  }


  const customData = (new CustomData());
  if (eventTitle) {customData.setContentName(eventTitle);}
  if (eventId) {customData.setContents([content]);}
  if (contentPrice) {
    customData
      .setCurrency(currency) // ISO 4217
      .setValue(contentPrice * contentQuantity);
  }


  const serverEvent = (new ServerEvent())
    .setEventName(eventName)
    .setEventTime(currentTimestamp)
    .setUserData(userData)
    .setActionSource(actionSource);
  if (eventId) {serverEvent.setCustomData(customData);}


  const eventsData = [serverEvent];
  const eventRequest = (new EventRequest(META_ACCESS_TOKEN, META_PIXEL_ID))
    .setEvents(eventsData);
  if (META_TEST_CODE) {eventRequest.setTestEventCode(META_TEST_CODE);}

  eventRequest.execute()
    .then(
      (response) => console.log('Response: ', response),
      (err) => console.error('Error: ', err),
    );
};

module.exports = {
  sendEventMeta,
};
