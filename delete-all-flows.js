"use strict";

let webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

let sfUsername = process.env.SF_USERNAME;
let sfPassword = process.env.SF_PASSWORD;

let driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

webdriver.promise.consume(function * exec() {

  yield driver.get('https://login.salesforce.com');

  // Login
  yield driver.findElement(By.id('username')).sendKeys(sfUsername);
  yield driver.findElement(By.id('password')).sendKeys(sfPassword);
  yield driver.findElement(By.id('Login')).click();

  // Open proces builder
  yield driver.wait(until.elementLocated(By.id('setupSearch')));

  let DevTools_icon = By.id('DevTools_icon');
  let Workflow_icon = By.id('Workflow_icon');
  let ProcessAutomation_font = By.id('ProcessAutomation_font');

  yield driver.wait(until.elementLocated(DevTools_icon));

  yield driver.findElement(DevTools_icon).click();
  yield driver.wait(until.elementLocated(Workflow_icon));

  yield driver.findElement(Workflow_icon).click();
  yield driver.wait(until.elementLocated(ProcessAutomation_font));
  yield driver.findElement(ProcessAutomation_font).click();

  //
  yield driver.wait(until.elementLocated(By.id('label')));
  // delete flows
  let dropdown = driver.findElement(By.css('table tbody td.label a:nth-child(1)'));

  console.log('start generator function');
  while(dropdown) {

    console.log('while try 11212');

    yield dropdown.click();

    // click delete button
    let deleteButton = By.css('table tbody tr.bodyRow.processuimgntVersionListRow td.col.action a');
    yield driver.wait(until.elementLocated(deleteButton));
    yield driver.findElement(deleteButton).click();

    // click OK confirm button
    let OKbutton = By.css('.dialog:not(.hidden) .buttons button.saveButton');
    yield driver.wait(until.elementLocated(OKbutton), 10000);

    //driver.wait(function () {
    //  let OKbutton = By.css('button.saveButton');
    //  return driver.findElement(OKbutton).isDisplayed();
    //}, 10000);
    yield driver.sleep(1000);

    yield driver.findElement(OKbutton).click();
    yield driver.sleep(2000);

    console.info('deleted one');

    try {
      dropdown = driver.findElement(By.css('table tbody td.label a:nth-child(1)'));

      if (!dropdown.isElementPresent() || !dropdown.isDisplayed()) {
        console.log('no dropdown anymore');
        dropdown = null;
        break;
      }
    } catch(err) {
      console.error('error:', err);
      dropdown = null;
      break;
    }
  }

});

console.log('done');
