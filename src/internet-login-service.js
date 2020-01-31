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

module.exports = class InternetLoginPuppeteerService {
  /**
   *
   * @param {object} credentials credenciales { username: 'xxxx', password: 'xxxx' }
   * @param {*} headless se oculta el navegador
   */
  constructor(credentials, headless = true) {
    this.browser = null;
    this.page = null;
    this.credentials = credentials;
    this.headless = headless;
  }

  async _closePage() {
    if (this.page != null && !this.page.isClosed()) {
      await this.page.close();
    }
    this.page = null;
  }

  async _launchBrowser() {
    if (this.browser == null || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        headless: this.headless
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
    if (await this.sessionOpen()) {
      return { code: 'SESION_ABIERTA', message: 'Tiene una sesión abierta, pruebe cerrarla' };
    }
    await this._launchBrowser();
    await this._closePage();
    this.page = await this.browser.newPage();

    let prevconnected = false;
    this.page.on('dialog', async (dialog) => {
      if (dialog.message() === 'El usuario ya está conectado.') {
        prevconnected = true;
      }
      await dialog.accept();
    });
    try {
      await this.page.goto(LOGIN_URL, { timeout: 3000 });
      await this.page.click(USERNAME_SELECTOR);
      await this.page.keyboard.type(this.credentials.username);
      await this.page.click(PASSWORD_SELECTOR);
      await this.page.keyboard.type(this.credentials.password);
      await Promise.all([
        this.page.waitForNavigation({ timeout: 3000 }),
        this.page.click(BUTTON_CONNECT_SELECTOR)
      ]);
    } catch (error) {
      this._closePage();
      return { code: 'ERROR', message: error.message };
    }
    if (prevconnected) {
      this._closePage();
      return { code: 'CONEXION_PREVIA_ESTABLECIDA', message: 'No es necesario conectarse, hay conexión' };
    }
    return (await this.page.$x(LABEL_CONNECTED_XPATH)).length > 0
      ? { code: 'CONEXION_EXITOSA', message: 'Conectado a internet' }
      : { code: 'CONEXION_FALLIDA', message: 'No se ha podido conectar a internet' };
  }

  async disconnet() {
    if (!await this.sessionOpen()) {
      return { code: 'SIN_SESION', message: 'Usted no tiene una sesión abierta para cerrar' };
    }
    // this.page.on('dialog', async (dialog) => {
    //   await dialog.accept();
    // });
    try {
      await Promise.all([
        this.page.waitForNavigation({ timeout: 3000 }),
        this.page.click(BUTTON_DISCONNET_SELECTOR),
      ]);
    } catch (error) {
      this._closePage();
      return { code: 'ERROR', message: error.message };
    }
    const disconneted = (await this.page.$x(LABEL_DISCONNECTED_XPATH)).length > 0;
    this._closePage();
    return disconneted
      ? { code: 'DESCONEXION_EXITOSA', message: 'Se ha desconectado de internet' }
      : { code: 'DESCONEXION_FALLIDA', message: 'No se ha podido desconectar de internet' };
  }

  async closeBrowser() {
    if (this.browser != null) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    return true;
  }

  async sessionOpen() {
    return this.page != null && !this.page.isClosed()
    && (await this.page.$x(LABEL_CONNECTED_XPATH)).length > 0;
  }
};