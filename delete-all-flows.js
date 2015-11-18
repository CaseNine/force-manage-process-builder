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

  // delete flows
  var dropdownLocator = By.css('table tbody td.label a:nth-child(1)');
  let dropdown = driver.findElement(dropdownLocator);

  console.log('start generator function');
  while(dropdown) {

    console.log('while try 11212');

    await dropdown.click();

    // click delete button
    let deleteButton = By.css('table tbody tr.bodyRow.processuimgntVersionListRow td.col.action a');
    await driver.wait(until.elementLocated(deleteButton));
    await driver.findElement(deleteButton).click();

    // click OK confirm button
    let OKbutton = By.css('.dialog:not(.hidden) .buttons button.saveButton');
    await driver.wait(until.elementLocated(OKbutton), 10000);

    //driver.wait(function () {
    //  let OKbutton = By.css('button.saveButton');
    //  return driver.findElement(OKbutton).isDisplayed();
    //}, 10000);
    await driver.sleep(1000);

    await driver.findElement(OKbutton).click();
    await driver.sleep(2000);

    console.info('deleted one');

    try {
      dropdown = driver.findElement(dropdownLocator);

      if (!driver.isElementPresent(dropdownLocator) || !dropdown.isDisplayed()) {
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

  console.log('done');

})();
