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

  // Open process builder
  await openLightningProcessBuilder(driver);

  // open flows
  let openFlowButtonLocator = By.css('td.label a:nth-child(2)');
  let statusColumnLocator = By.css('td.status[title="Actief"]');
  let tableRowLocator = By.css('tr.processuimgntConsoleListRow');

  let activeRowLocator = function () {
    let tableRowElement = driver.findElements(tableRowLocator);
    return webdriver.promise.filter(tableRowElement, function (row) {
      return row.isElementPresent(statusColumnLocator);
    }).then(function (activeRows) {
      return activeRows[0];
    });
  };

  let tableRow = await driver.findElement(activeRowLocator);


  let deactivateButton = By.css('button.activate');
  let OKbutton = By.css('.dialog:not(.hidden) .buttons button.saveButton');
  let backButton = By.css('button.back');

  console.log('start generator function');
  while(tableRow) {

    console.log('while try 11212');

    let openFlowButton = tableRow.findElement(openFlowButtonLocator);

    await openFlowButton.click();

    // click deactivate button
    await driver.wait(until.elementLocated(deactivateButton));
    await driver.findElement(deactivateButton).click();

    // click OK confirm button
    await driver.wait(until.elementLocated(OKbutton), 10000);
    await driver.findElement(OKbutton).click();

    // click back button, back to list view
    await driver.sleep(2000);

    await driver.wait(until.elementLocated(backButton));
    await driver.findElement(backButton).click();

    await driver.sleep(1500);
    console.info('deactivated one');

    try {
      // Wait while the proces builder page loads
      await driver.wait(until.elementLocated(By.id('label')));
      await driver.wait(elemIsVisible(By.id('label')));

      tableRow = driver.findElement(activeRowLocator);
      if (!driver.isElementPresent(activeRowLocator) || !tableRow.isDisplayed()) {
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

  console.log('done');
})();
