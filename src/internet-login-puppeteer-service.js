/**
 * Conecta y desconecta el acceso a internet por wifi etecsa
 */
const puppeteer = require('puppeteer');

const LOGIN_URL = 'https://secure.etecsa.net:8443';
const USERNAME_SELECTOR = '#username';
const PASSWORD_SELECTOR = '#password';
const BUTTON_CONNECT_SELECTOR = '#formulario > input[name="Enviar"]';
const LABEL_CONNECTED_XPATH = "//span[contains(.,'Usted está conectado')]";
const BUTTON_DISCONNET_SELECTOR = 'input[name="logout"]';
const LABEL_DISCONNECTED_XPATH = "//div[contains(.,'Usted ha cerrado con éxito su sesión.')]";
const ONLINE_TIME_SELECTOR = '#onlineTime';
const AVAILABLE_TIME_SELECTOR = '#availableTime';

module.exports = class InternetLoginPuppeteerService {
  /**
   *
   * @param {object} credentials credenciales { username: 'xxxx', password: 'xxxx' }
   * @param {string} headless se oculta el navegador
   * @param {number} pupTimeout timeout
   * @param {Function} command command
   */
  constructor(credentials, headless = true, pupTimeout = 4000, command = null) {
    this.#credentials = credentials;
    this.#headless = headless;
    this.#pupTimeout = pupTimeout;
    this.#command = typeof command === 'function' ? command : () => 0;
  }

  #browser = null;

  #page = null;

  #command = null;

  #pupTimeout = 4000;

  #headless = true;

  #credentials

  async _closePage() {
    if (this.#page != null && !this.#page.isClosed()) {
      await this.#page.close();
    }
    this.#page = null;
  }

  async _launchBrowser() {
    if (this.#browser == null || !this.#browser.isConnected()) {
      this.#browser = await puppeteer.launch({
        headless: this.#headless
      });
    }
  }

  async toggle() {
    if (await this.sessionOpen()) {
      return this.disconnet();
    }
    return this.connet();
  }

  async connet() {
    const cout = await this.#command();
    if (cout !== 0) {
      console.log({ code: cout.code, message: cout.message });
      return { code: cout.code, message: cout.message };
    }
    if (await this.sessionOpen()) {
      return { code: 'SESION_ABIERTA', message: 'Tiene una sesión abierta, pruebe cerrarla' };
    }
    await this._launchBrowser();
    await this._closePage();
    this.#page = await this.#browser.newPage();

    let prevconnected = false;
    this.#page.on('dialog', async (dialog) => {
      if (dialog.message() === 'El usuario ya está conectado.'
      || dialog.message() === 'Usted ha realizado muchos intentos. Por favor intente más tarde.') {
        prevconnected = true;
      }
      await dialog.accept();
    });
    try {
      await this.#page.goto(LOGIN_URL, { timeout: this.#pupTimeout });
      await this.#page.click(USERNAME_SELECTOR);
      await this.#page.keyboard.type(this.#credentials.username);
      await this.#page.click(PASSWORD_SELECTOR);
      await this.#page.keyboard.type(this.#credentials.password);
      await Promise.all([
        this.#page.waitForNavigation({ timeout: this.#pupTimeout }),
        this.#page.click(BUTTON_CONNECT_SELECTOR)
      ]);
    } catch (error) {
      this._closePage();
      return { code: 'ERROR', message: error.message };
    }
    if (prevconnected) {
      this._closePage();
      return { code: 'CONEXION_PREVIA', message: 'No es necesario conectarse, hay conexión' };
    }
    return (await this.#page.$x(LABEL_CONNECTED_XPATH)).length > 0
      ? { code: 'CONECTADO', message: 'Conectado a internet' }
      : { code: 'CONEXION_FALLIDA', message: 'No se ha podido conectar a internet' };
  }

  async disconnet() {
    if (!await this.sessionOpen()) {
      return { code: 'SIN_SESION', message: 'Usted no tiene sesión abierta que cerrar' };
    }
    // this.page.on('dialog', async (dialog) => {
    //   await dialog.accept();
    // });
    let onlineTime = '';
    let availableTime = '';
    try {
      onlineTime = await this.#page.$eval(ONLINE_TIME_SELECTOR, el => el.innerText);
      availableTime = await this.#page.$eval(AVAILABLE_TIME_SELECTOR, el => el.innerText);
      await Promise.all([
        this.#page.waitForNavigation({ timeout: this.#pupTimeout }),
        this.#page.click(BUTTON_DISCONNET_SELECTOR),
      ]);
    } catch (error) {
      this._closePage();
      return { code: 'ERROR', message: error.message };
    }
    const disconneted = (await this.#page.$x(LABEL_DISCONNECTED_XPATH)).length > 0;
    this._closePage();
    return disconneted
      ? { code: 'DESCONECTADO', message: `Desconectado, tenias: ${availableTime}, consumiste: ${onlineTime}` }
      : { code: 'DESCONEXION_FALLIDA', message: 'No se ha podido desconectar de internet' };
  }

  async closeBrowser() {
    if (this.#browser != null) {
      await this.#browser.close();
      this.#browser = null;
      this.#page = null;
    }
    return true;
  }

  async sessionOpen() {
    try {
      return this.#page != null && !this.#page.isClosed()
      && (await this.#page.$x(LABEL_CONNECTED_XPATH)).length > 0;
    } catch (error) {
      return false;
    }
  }
};
