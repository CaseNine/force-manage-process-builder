'use strict';

let argv = require('yargs').argv;
let navigate = require('./navigate');
let impl = require('./impl');
let webdriver = require('selenium-webdriver');
let jsforce = require('jsforce');

let sfUsername = process.env.SF_USERNAME;
let sfPassword = process.env.SF_PASSWORD;
let jsforceConn = new jsforce.Connection();


webdriver.promise.consume(function * exec() {
  yield jsforceConn.login(sfUsername, sfPassword);

  switch (argv._[0]) {
    case 'activate-meetdataverwacht-scheduled-apex':
      return yield * impl.activateMeetdataverwachtScheduledApex(jsforceConn);
      break;
    case 'deactivate-meetdataverwacht-scheduled-apex':
      return yield * impl.deactivateMeetdataverwachtScheduledApex(jsforceConn);
      break;
    case 'remove-email-services':
      return yield * impl.removeEmailServices(jsforceConn);
      break;
    case 'insert-email-services':
      return yield * impl.insertEmailServiceAddress(jsforceConn);
      break;
  }
}).then(function () {
  console.log('done');
}, function (err) {
  console.error('err', err);
});
