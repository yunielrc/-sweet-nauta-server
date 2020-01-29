/**
 * Conecta y desconecta el acceso a internet por wifi etecsa
 */
const { Builder, By, until } = require('selenium-webdriver');
const ping = require('ping');

module.exports = class InternetEtecsaLoginService {
  constructor() {
    this.driver = null;
  }

  async toggle() {
    if (await this.isConnected()) {
      return this.disconnet();
    }
    return this.connet();
  }

  async connet() {
    if (await this.isConnected()) {
      throw new Error('ERR_CURRENTLY_CONNECTED');
    }

    try {
      this.driver = new Builder().forBrowser('chrome').build();
      await this.driver.get('https://secure.etecsa.net:8443/');

      await this.driver.findElement(By.id('username')).sendKeys('yuniel.roque@nauta.com.cu');
      await this.driver.findElement(By.id('password')).sendKeys('U4mjdnkRikgf4p2/');
      await this.driver.findElement(By.name('Enviar')).click();
      const elements = await this.driver.findElements(By.xpath("//span[contains(.,'Usted está conectado')]"));

      return elements.length !== 0;
    } catch (err) {
      await this.driver.close();
      await this.driver.quit();
      throw err;
    }
  }

  async disconnet() {
    if (!await this.isConnected()) {
      throw new Error('ERR_CURRENTLY_DISCONNECTED');
    }
    if (this.driver === null) {
      throw new Error('ERR_TRY_TO_CONNECT_FIRST');
    }
    try {
      await this.driver.findElement(By.name('logout')).click();
      await this.driver.switchTo().alert().accept();
      await this.driver.wait(until.elementLocated(By.css('.info-white1')), 2000);
      const result = await this.driver.findElement(By.css('.info-white1')).getText() === 'Usted ha cerrado con éxito su sesión.';

      return result;
    } finally {
      await this.driver.close();
      await this.driver.quit();
      this.driver = null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  isConnected() {
    return new Promise((resolve, reject) => {
      try {
        ping.sys.probe('8.8.8.8', (isAlive) => { resolve(isAlive); });
      } catch (error) {
        reject(error);
      }
    });
  }
};
