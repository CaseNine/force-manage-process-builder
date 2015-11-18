"use strict";

import * as webdriver from 'selenium-webdriver';
import * as url from 'url';
import { login, openLightningProcessBuilder, elemIsVisible } from 'navigate';

let By = webdriver.By,
    until = webdriver.until;

let sfUsername = process.env.SF_USERNAME;
let sfPassword = process.env.SF_PASSWORD;
let sfLoginUrl = process.env.SF_LOGIN_URL;
let browser = process.env.BROWSER;

let driver = new webdriver.Builder()
    .forBrowser(browser)
    .build();

(async function () {

  // Login
  await login(driver, sfUsername, sfPassword, sfLoginUrl);

  // Open proces builder
  await openLightningProcessBuilder(driver);

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

  let tableRow = await driver.findElement(inactiveRowLocator);

  console.log('start generator function');
  while (tableRow) {

    console.log('while try 11212');

    let openFlowButton = tableRow.findElement(openFlowButtonLocator);

    await openFlowButton.click();

    // click delete button
    let activateButton = By.css('button.activate');
    await driver.wait(until.elementLocated(activateButton));
    await driver.findElement(activateButton).click();

    // click OK confirm button
    let OKbutton = By.css('.dialog:not(.hidden) .buttons button.saveButton');
    await driver.wait(until.elementLocated(OKbutton), 10000);
    await driver.findElement(OKbutton).click();

    //driver.wait(function () {
    //  let OKbutton = By.css('button.saveButton');
    //  return driver.findElement(OKbutton).isDisplayed();
    //}, 10000);
    //await driver.sleep(3000);


    // click back button, back to list view
    await driver.sleep(2000);
    let backButton = By.css('button.back');
    await driver.wait(until.elementLocated(backButton));
    await driver.wait(elemIsVisible(backButton));
    await driver.findElement(backButton).click();

    await driver.sleep(1000);
    console.info('activated one');

    try {
      // Wait while the proces builder page loads
      await driver.wait(until.elementLocated(By.id('label')));
      await driver.wait(elemIsVisible(By.id('label')));

      tableRow = driver.findElement(inactiveRowLocator);
      if (!driver.isElementPresent(inactiveRowLocator) || !tableRow.isDisplayed()) {
        console.log('no table row anymore');
        tableRow = null;
        break;
      }
    } catch (err) {
      console.error('error:', err);
      tableRow = null;
      break;
    }
  }

  console.log('done');

})();
