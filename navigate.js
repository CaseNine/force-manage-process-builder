'use strict';

exports.gotoSetup = gotoSetup;
exports.createScheduledApex = createScheduledApex;
exports.createScheduledApexWithJsforce = createScheduledApexWithJsforce;
exports.removeScheduledApexWithJsforce = removeScheduledApexWithJsforce;
exports.login = login;
exports.fetchEmailServices = fetchEmailServices;
exports.fetchEmailServiceAddresses = fetchEmailServiceAddresses;
exports.createEmailServiceAddress = createEmailServiceAddress;
exports.createEmailService = createEmailService;
exports.fetchApexClassByName = fetchApexClassByName;


let webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
let jsforce = require('jsforce');


/**
 * @param {webdriver.WebDriver} driver
 */
function * gotoSetup(driver) {
  return driver.get('https://eu5.salesforce.com/setup/forcecomHomepage.apexp');
}

/**
 * @param {jsforce.Connection} jsforceConn
 * @param {string} class_
 * @param {string} cronExpr
 */
function * createScheduledApexWithJsforce(jsforceConn, class_, cronExpr) {
  let apexCode = `${class_} inst = new ${class_}();
      String sch = '${cronExpr}';
      String jobID = System.schedule('auto scheduled job ${class_}', sch, inst);
      System.debug(jobID);`;

  let resultSchedule = yield jsforceConn.tooling.executeAnonymous(apexCode);
  if (resultSchedule.success !== true) {
    throw resultSchedule;
  }

  let cronTriggers = yield jsforceConn.query('SELECT Id FROM CronTrigger ORDER BY CreatedDate DESC LIMIT 1');
  return cronTriggers.records[0];
}

/**
 * @param {jsforce.Connection} jsforceConn
 * @param {string} jobId
 */
function * removeScheduledApexWithJsforce(jsforceConn, jobId) {
  let apexCode = `System.abortJob('${jobId}');`;

  let resultAbort = yield jsforceConn.tooling.executeAnonymous(apexCode);
  console.log(resultAbort);
  if (resultAbort.success !== true) {
    throw resultAbort;
  }
  return resultAbort;
}


/**
 * @param {jsforce.Connection} jsforceConn
 * @param {string} className
 * @returns {Record}
 */
function * fetchApexClassByName(jsforceConn, className) {
  let q = `SELECT Id FROM ApexClass WHERE Name = '${className}'`;
  let classResult = (yield jsforceConn.query(q)).records;

  if (classResult.length < 1) {
    throw 'No such class found';
  }

  return classResult[0];
}


/**
 * @param {jsforce.Connection} jsforceConn
 * @param {string} className
 * @returns {Record}
 */
function * fetchEmailServicesByClassName(jsforceConn, className) {
  let class_ = yield fetchApexClassByName(jsforceConn, className);

  let q = `SELECT AddressInactiveAction,ApexClassId,AttachmentOption,AuthenticationFailureAction,AuthorizationFailureAction,AuthorizedSenders,CreatedById,CreatedDate,ErrorRoutingAddress,FunctionInactiveAction,FunctionName,Id,IsActive,IsAuthenticationRequired,IsErrorRoutingEnabled,IsTextAttachmentsAsBinary,IsTlsRequired,LastModifiedById,LastModifiedDate,OverLimitAction,SystemModstamp
  FROM EmailServicesFunction
  WHERE ApexClassId = ${class_.Id}}`;

  let emailServicesResult = (yield jsforceConn.query(q)).records;
  if (emailServicesResult.length < 1) {
    throw 'No such e-mail service found';
  }

  return emailServicesResult[0];
}


/**
 * @param {jsforce.Connection} jsforceConn
 * @returns {Array.<Record>}
 */
function * fetchEmailServices(jsforceConn) {
  let q = `
      SELECT AddressInactiveAction,ApexClassId,AttachmentOption,AuthenticationFailureAction,AuthorizationFailureAction,AuthorizedSenders,CreatedById,CreatedDate,ErrorRoutingAddress,FunctionInactiveAction,FunctionName,Id,IsActive,IsAuthenticationRequired,IsErrorRoutingEnabled,IsTextAttachmentsAsBinary,IsTlsRequired,LastModifiedById,LastModifiedDate,OverLimitAction,SystemModstamp
      FROM EmailServicesFunction`;

  return (yield jsforceConn.query(q)).records;
}

/**
 * @param {jsforce.Connection} jsforceConn
 * @returns {Array.<Record>}
 */
function * fetchEmailServiceAddresses(jsforceConn) {
  let q = `
      SELECT AuthorizedSenders,CreatedById,CreatedDate,EmailDomainName,FunctionId,Id,IsActive,LastModifiedById,LastModifiedDate,LocalPart,RunAsUserId,SystemModstamp
      FROM EmailServicesAddress`;

  return (yield jsforceConn.query(q)).records;
}

/**
 * @param {jsforce.Connection} jsforceConn
 * @param classId
 *
 * https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_objects_emailservicesfunction.htm
 */
function * createEmailService(jsforceConn, classId) {
  let service = {
    //AddressInactiveAction: '',
    ApexClassId: classId,
    AttachmentOption: 3, // accepts any attachment type
    //AuthenticationFailureAction: '',
    //AuthorizationFailureAction: '',
    //AuthorizedSenders: '',
    //ErrorRoutingAddress: '',
    //FunctionInactiveAction: '',
    FunctionName: 'InboundEmailHandler',
    IsActive: true
    //IsAuthenticationRequired: '',
    //IsErrorRoutingEnabled: '',
    //IsTextAttachmentsAsBinary: '',
    //IsTextTruncated: '',
    //IsTlsRequired: '',
    //OverLimitAction: ''
  };

  return yield jsforceConn.sobject('EmailServicesFunction').insert(service);
}

/**
 * @param {jsforce.Connection} jsforceConn
 * @param {string} emailServiceId
 *
 * https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_objects_emailservicesaddress.htm
 */
function * createEmailServiceAddress(jsforceConn, emailServiceId) {
  let address = {
    //AuthorizedSenders: '',
    //EmailDomainName: '',
    FunctionId: emailServiceId,
    IsActive: true,
    //AddressInactiveAction: '',
    LocalPart: 'test-InboundEmailHandler',
    RunAsUserId: jsforceConn.userInfo.id
  };

  return yield jsforceConn.sobject('EmailServicesAddress').insert(address);
}


/**
 * @param {webdriver.WebDriver} driver
 * @param {string} class_
 */
function * createScheduledApex(driver, class_) {
  let endDate = '20-10-2099';
  yield driver.get('https://eu5.salesforce.com/ui/setup/apex/batch/ScheduleBatchApexPage');

  yield driver.findElement(By.id('job_name')).sendKeys('Auto planned ' + class_);

  yield driver.findElement(By.id('ac')).sendKeys(class_);

  yield driver.findElement(By.id('ww00')).click();
  yield driver.findElement(By.id('ww10')).click();
  yield driver.findElement(By.id('ww20')).click();
  yield driver.findElement(By.id('ww30')).click();
  yield driver.findElement(By.id('ww40')).click();
  yield driver.findElement(By.id('ww50')).click();
  yield driver.findElement(By.id('ww60')).click();

  let endDateElem = driver.findElement(By.id('end0'));
  yield endDateElem.clear();
  yield endDateElem.sendKeys(endDate);
  // blur the focus for the datepicker
  yield driver.findElement(By.tagName('body')).click();

  let dropdown = driver.findElement(By.id('pst0'));
  yield dropdown.click();
  yield dropdown.findElement(By.css('option[value=\'0:00\']')).click();

  yield driver.findElement(By.css('form[action=\'/ui/setup/apex/batch/ScheduleBatchApexPage?setupid=ScheduledJobs\']')).submit();
}


/**
 * @param {webdriver.WebDriver} driver
 * @param {string} username
 * @param {string} password
 */
function * login(driver, username, password) {
  yield driver.get('https://login.salesforce.com');

  // Login
  yield driver.findElement(By.id('username')).sendKeys(username);
  yield driver.findElement(By.id('password')).sendKeys(password);
  yield driver.findElement(By.id('Login')).click();
}
