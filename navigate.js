'use strict';

import * as webdriver from 'selenium-webdriver';
import * as jsforce from 'jsforce';
import * as url from 'url';

let By = webdriver.By,
    until = webdriver.until;


/**
 * @param {webdriver.WebDriver} driver
 */
export async function gotoSetup(driver) {
  return (await driver.get('https://eu5.salesforce.com/setup/forcecomHomepage.apexp'));
}

/**
 * @param {jsforce.Connection} jsforceConn
 * @param {string} class_
 * @param {string} cronExpr
 */
export async function createScheduledApexWithJsforce(jsforceConn, class_, cronExpr) {
  let apexCode = `${class_} inst = new ${class_}();
      String sch = '${cronExpr}';
      String jobID = System.schedule('auto scheduled job ${class_}', sch, inst);
      System.debug(jobID);`;

  let resultSchedule = await jsforceConn.tooling.executeAnonymous(apexCode);
  if (resultSchedule.success !== true) {
    throw resultSchedule;
  }

  let cronTriggers = await fetchCronTriggers(jsforceConn);
  return cronTriggers.records[0];
}

/**
 * @param {jsforce.Connection} jsforceConn
 */
export async function fetchCronTriggers(jsforceConn) {
  return (await jsforceConn.query(`
      SELECT Id, CronJobDetail.Id, CronJobDetail.Name, CronJobDetail.JobType
      FROM CronTrigger`));
}

/**
 * @param {jsforce.Connection} jsforceConn
 * @param {string} jobName
 * @returns {Array.<Record>}
 */
export async function fetchCronTriggersByName(jsforceConn, jobName) {
  //CronJobDetail
  return (await jsforceConn.query(`
      SELECT Id, CronJobDetail.Id, CronJobDetail.Name, CronJobDetail.JobType
      FROM CronTrigger
      WHERE CronJobDetail.Name = ${jobName}`)).records;
}


/**
 * @param {jsforce.Connection} jsforceConn
 * @param {string} jobId
 */
export async function removeScheduledApexWithJsforce(jsforceConn, jobId) {
  let apexCode = `System.abortJob('${jobId}');`;

  let resultAbort = await jsforceConn.tooling.executeAnonymous(apexCode);
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
export async function fetchApexClassByName(jsforceConn, className) {
  let q = `SELECT Id FROM ApexClass WHERE Name = '${className}'`;
  let classResult = (await jsforceConn.query(q)).records;

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
export async function fetchEmailServicesByClassName(jsforceConn, className) {
  let class_ = await fetchApexClassByName(jsforceConn, className);

  let q = `SELECT AddressInactiveAction,ApexClassId,AttachmentOption,AuthenticationFailureAction,AuthorizationFailureAction,AuthorizedSenders,CreatedById,CreatedDate,ErrorRoutingAddress,FunctionInactiveAction,FunctionName,Id,IsActive,IsAuthenticationRequired,IsErrorRoutingEnabled,IsTextAttachmentsAsBinary,IsTlsRequired,LastModifiedById,LastModifiedDate,OverLimitAction,SystemModstamp
  FROM EmailServicesFunction
  WHERE ApexClassId = ${class_.Id}}`;

  let emailServicesResult = (await jsforceConn.query(q)).records;
  if (emailServicesResult.length < 1) {
    throw 'No such e-mail service found';
  }

  return emailServicesResult[0];
}


/**
 * @param {jsforce.Connection} jsforceConn
 * @returns {Array.<Record>}
 */
export async function fetchEmailServices(jsforceConn) {
  let q = `
      SELECT AddressInactiveAction,ApexClassId,AttachmentOption,AuthenticationFailureAction,AuthorizationFailureAction,AuthorizedSenders,CreatedById,CreatedDate,ErrorRoutingAddress,FunctionInactiveAction,FunctionName,Id,IsActive,IsAuthenticationRequired,IsErrorRoutingEnabled,IsTextAttachmentsAsBinary,IsTlsRequired,LastModifiedById,LastModifiedDate,OverLimitAction,SystemModstamp
      FROM EmailServicesFunction`;

  return (await jsforceConn.query(q)).records;
}

/**
 * @param {jsforce.Connection} jsforceConn
 * @returns {Array.<Record>}
 */
export async function fetchEmailServiceAddresses(jsforceConn) {
  let q = `
      SELECT AuthorizedSenders,CreatedById,CreatedDate,EmailDomainName,FunctionId,Id,IsActive,LastModifiedById,LastModifiedDate,LocalPart,RunAsUserId,SystemModstamp
      FROM EmailServicesAddress`;

  return (await jsforceConn.query(q)).records;
}

/**
 * @param {jsforce.Connection} jsforceConn
 * @param classId
 *
 * https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_objects_emailservicesfunction.htm
 */
export async function createEmailService(jsforceConn, classId) {
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

  return await jsforceConn.sobject('EmailServicesFunction').insert(service);
}

/**
 * @param {jsforce.Connection} jsforceConn
 * @param {string} emailServiceId
 *
 * https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_objects_emailservicesaddress.htm
 */
export async function createEmailServiceAddress(jsforceConn, emailServiceId) {
  let address = {
    //AuthorizedSenders: '',
    //EmailDomainName: '',
    FunctionId: emailServiceId,
    IsActive: true,
    //AddressInactiveAction: '',
    LocalPart: 'test-InboundEmailHandler',
    RunAsUserId: jsforceConn.userInfo.id
  };

  return await jsforceConn.sobject('EmailServicesAddress').insert(address);
}


/**
 * @param {webdriver.WebDriver} driver
 * @param {string} class_
 */
export async function createScheduledApex(driver, class_) {
  let endDate = '20-10-2099';
  await driver.get('https://eu5.salesforce.com/ui/setup/apex/batch/ScheduleBatchApexPage');

  await driver.findElement(By.id('job_name')).sendKeys('Auto planned ' + class_);

  await driver.findElement(By.id('ac')).sendKeys(class_);

  await driver.findElement(By.id('ww00')).click();
  await driver.findElement(By.id('ww10')).click();
  await driver.findElement(By.id('ww20')).click();
  await driver.findElement(By.id('ww30')).click();
  await driver.findElement(By.id('ww40')).click();
  await driver.findElement(By.id('ww50')).click();
  await driver.findElement(By.id('ww60')).click();

  let endDateElem = driver.findElement(By.id('end0'));
  await endDateElem.clear();
  await endDateElem.sendKeys(endDate);
  // blur the focus for the datepicker
  await driver.findElement(By.tagName('body')).click();

  let dropdown = driver.findElement(By.id('pst0'));
  await dropdown.click();
  await dropdown.findElement(By.css('option[value=\'0:00\']')).click();

  await driver.findElement(By.css('form[action=\'/ui/setup/apex/batch/ScheduleBatchApexPage?setupid=ScheduledJobs\']')).submit();
}


/**
 * @param {webdriver.WebDriver} driver
 * @param {string} username
 * @param {string} password
 * @param {string} loginUrl
 */
export async function login(driver, username, password, loginUrl) {
  await driver.get(loginUrl);

  // Login
  await driver.findElement(By.id('username')).sendKeys(username);
  await driver.findElement(By.id('password')).sendKeys(password);
  await driver.findElement(By.id('Login')).click();

  // Wait for page load
  const appMenuLocator = By.id('toolbar');
  await driver.wait(until.elementLocated(appMenuLocator));
}

/**
 * @param {webdriver.WebDriver} driver
 */
export async function openLightningProcessBuilder(driver) {
  const processBuilderUrl = `${getInstanceUrl(driver)}/processui/processui.app`;
  console.log('URL Lightning Process Builder', processBuilderUrl);
  await driver.get(processBuilderUrl);

  // Wait while the proces builder page loads
  await driver.wait(until.elementLocated(By.id('label')));
}

/**
 * @param {webdriver.WebDriver} driver
 * @returns {string}
 */
export async function getInstanceUrl(driver) {
  let currentUrl = await driver.getCurrentUrl();
  let currentUrlParsed = url.parse(currentUrl);

  return `${currentUrlParsed.protocol}//${currentUrlParsed.hostname}`;
}

/**
 * @param {webdriver.Locator} locator
 * @returns {webdriver.until.Condition}
 */
export function elemIsVisible(locator) {
  return new until.Condition('wait for visible of elem', function(_driver) {
    try {
      _driver.findElement(locator);
      return true;
    } catch (err) {
      return false;
    }
  });
}
