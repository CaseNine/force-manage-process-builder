"use strict";

let webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

let sfUsername = process.env.SF_USERNAME;
let sfPassword = process.env.SF_PASSWORD;

let driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

yield webdriver.promise.consume(function * exec() {

  yield driver.get('https://login.salesforce.com');

  // Login
  yield driver.findElement(By.id('username')).sendKeys(sfUsername);
  yield driver.findElement(By.id('password')).sendKeys(sfPassword);
  yield driver.findElement(By.id('Login')).click();

  // Open proces builder
  yield driver.wait(until.elementLocated(By.id('setupSearch')));

  var DevTools_icon = By.id('DevTools_icon');
  yield driver.wait(until.elementLocated(DevTools_icon));
  yield driver.findElement(DevTools_icon).click();

  var Workflow_icon = By.id('Workflow_icon');
  yield driver.wait(until.elementLocated(Workflow_icon));
  yield driver.findElement(Workflow_icon).click();

  var ProcessAutomation_font = By.id('ProcessAutomation_font');
  yield driver.wait(until.elementLocated(ProcessAutomation_font));
  yield driver.findElement(ProcessAutomation_font).click();

  // Wait while the proces builder page loads
  yield driver.wait(until.elementLocated(By.id('label')));

  // open flows
  var openFlowButtonLocator = By.css('table tbody td.label a:nth-child(2)');
  let openFlowButton = driver.findElement(openFlowButtonLocator);

  console.log('start generator function');
  while(openFlowButton) {

    console.log('while try 11212');

    yield openFlowButton.click();

    // click delete button
    let activateButton = By.css('button.activate');
    yield driver.wait(until.elementLocated(activateButton));
    yield driver.findElement(activateButton).click();

    // click OK confirm button
    let OKbutton = By.css('.dialog:not(.hidden) .buttons button.saveButton');
    yield driver.wait(until.elementLocated(OKbutton), 10000);

    //driver.wait(function () {
    //  let OKbutton = By.css('button.saveButton');
    //  return driver.findElement(OKbutton).isDisplayed();
    //}, 10000);
    //yield driver.sleep(3000);


    // click back button, back to list view
    yield driver.sleep(3000);
    let backButton = By.css('button.back');
    yield driver.wait(until.elementLocated(backButton));
    yield driver.findElement(backButton).click();

    yield driver.sleep(1000);
    console.info('activated one');

    try {
      openFlowButton = driver.findElement(openFlowButtonLocator);

      if (!openFlowButton.isElementPresent() || !openFlowButton.isDisplayed()) {
        console.log('no dropdown anymore');
        openFlowButton = null;
        break;
      }


    } catch(err) {
      console.error('error:', err);
      openFlowButton = null;
      break;
    }
  }

});

console.log('done');
