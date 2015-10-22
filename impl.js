'use strict';

exports.activateMeetdataverwachtScheduledApex = activateMeetdataverwachtScheduledApex;
exports.deactivateMeetdataverwachtScheduledApex = deactivateMeetdataverwachtScheduledApex;
exports.removeEmailServices = removeEmailServices;
exports.insertEmailServiceAddress = insertEmailServiceAddress;

let navigate = require('./navigate');

let sfUsername = process.env.SF_USERNAME;
let sfPassword = process.env.SF_PASSWORD;


function * activateMeetdataverwachtScheduledApex(jsforceConn) {
  // Every day
  const CRON_EXPR = '0 0 * * * ?';

  try {
    let scheduleResult = yield * navigate.createScheduledApexWithJsforce(jsforceConn, 'CreateMeetdataVerwacht', CRON_EXPR);
    console.log('scheduleResult', scheduleResult);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function * deactivateMeetdataverwachtScheduledApex(jsforceConn) {
  try {
    let cronTriggers = yield * navigate.fetchCronTriggersByName(jsforceConn, 'auto scheduled job CreateMeetdataVerwacht');

    for (let cronTrigger of cronTriggers) {
      let removeScheduleResult = yield * navigate.removeScheduledApexWithJsforce(jsforceConn, cronTrigger.Id);
      console.log('removeScheduleResult', removeScheduleResult, cronTrigger);
    }

    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function * removeEmailServices(jsforceConn) {
  try {
    let addresses = yield * navigate.fetchEmailServiceAddresses(jsforceConn);
    let addressIds = addresses.map(address => address.Id);
    let deleteAdressesResult = yield jsforceConn.sobject('EmailServicesAddress').destroy(addressIds);
    console.log('deleteAdressesResult', deleteAdressesResult);

    let emailServices = yield * navigate.fetchEmailServices(jsforceConn);
    let emailServiceIds = emailServices.map(service => service.Id);
    let deleteResult = yield jsforceConn.sobject('EmailServicesFunction').destroy(emailServiceIds);

    console.log('deleteResult', deleteResult);
    return deleteResult;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function * insertEmailServiceAddress(jsforceConn) {
  try {
    let classId = (yield * navigate.fetchApexClassByName(jsforceConn, 'InboundEmailInhuizingsAanvraagService')).Id;
    let serviceResult = yield * navigate.createEmailService(jsforceConn, classId);
    console.log('serviceResult', serviceResult);

    let addressResult = yield * navigate.createEmailServiceAddress(jsforceConn, serviceResult.id);
    console.log('addressResult', addressResult);
    return addressResult;
  } catch (err) {
    console.error(err);
    throw err;
  }
}


