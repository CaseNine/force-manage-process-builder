"use strict";

let webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
let url = require('url');

let sfUsername = process.env.SF_USERNAME;
let sfPassword = process.env.SF_PASSWORD;
let sfLoginUrl = process.env.SF_LOGIN_URL;
let browser = process.env.BROWSER;

let driver = new webdriver.Builder()
    .forBrowser(browser)
    .build();

webdriver.promise.consume(function * exec() {

  yield driver.get(sfLoginUrl);

  // Login
  yield driver.findElement(By.id('username')).sendKeys(sfUsername);
  yield driver.findElement(By.id('password')).sendKeys(sfPassword);
  yield driver.findElement(By.id('Login')).click();

  // Open proces builder
  yield driver.wait(until.elementLocated(By.id('setupSearch')));

  let currentUrl = yield driver.getCurrentUrl();
  let currentUrlParsed = url.parse(currentUrl);

  yield driver.get(`${currentUrlParsed.protocol}://${currentUrlParsed.hostname}/processui/processui.app`);


  // Wait while the proces builder page loads
  yield driver.wait(until.elementLocated(By.id('label')));

  // open flows
  //var openFlowButtonLocator = By.css('table tbody td.label a:nth-child(2)');
  // open flows
  let openFlowButtonLocator = By.css('td.label a:nth-child(2)');
  let statusColumnLocator = By.css('td.status[title="Inactief"]');
  let tableRowLocator = By.css('tr.processuimgntConsoleListRow');
  //let openFlowButton = driver.findElement(openFlowButtonLocator);

  let inactiveRowLocator = function () {
    let tableRowElement = driver.findElements(tableRowLocator);
    return webdriver.promise.filter(tableRowElement, function (row) {
      return row.isElementPresent(statusColumnLocator);
    }).then(function (activeRows) {
      return activeRows[0];
    });
  };

  let tableRow = yield driver.findElement(inactiveRowLocator);

  console.log('start generator function');
  while(tableRow) {

    console.log('while try 11212');

    let openFlowButton = tableRow.findElement(openFlowButtonLocator);

    yield openFlowButton.click();

    // click delete button
    let activateButton = By.css('button.activate');
    yield driver.wait(until.elementLocated(activateButton));
    yield driver.findElement(activateButton).click();

    // click OK confirm button
    let OKbutton = By.css('.dialog:not(.hidden) .buttons button.saveButton');
    yield driver.wait(until.elementLocated(OKbutton), 10000);
    yield driver.findElement(OKbutton).click();

    //driver.wait(function () {
    //  let OKbutton = By.css('button.saveButton');
    //  return driver.findElement(OKbutton).isDisplayed();
    //}, 10000);
    //yield driver.sleep(3000);


    // click back button, back to list view
    yield driver.sleep(2000);
    let backButton = By.css('button.back');
    yield driver.wait(until.elementLocated(backButton));
    yield driver.findElement(backButton).click();

    yield driver.sleep(1000);
    console.info('activated one');

    try {
      tableRow = driver.findElement(inactiveRowLocator);
      if (!driver.isElementPresent(inactiveRowLocator) || !tableRow.isDisplayed()) {
        console.log('no table row anymore');
        tableRow = null;
        break;
      }
    } catch(err) {
      console.error('error:', err);
      tableRow = null;
      break;
    }
  }

});

console.log('done');
