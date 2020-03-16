/**
 * Conecta y desconecta el acceso a internet por wifi etecsa
 */
const puppeteer = require('puppeteer');
const v = require('validator');
const ppnc = require('./nocov/ppnc');

const LOGIN_URL = 'https://secure.etecsa.net:8443';
const USERNAME_SELECTOR = '#username';
const PASSWORD_SELECTOR = '#password';
const BUTTON_CONNECT_SELECTOR = '#formulario > input[name="Enviar"]';
const LABEL_CONNECTED_XPATH = "//span[contains(.,'Usted está conectado')]";
const BUTTON_DISCONNET_SELECTOR = 'input[name="logout"]';
const LABEL_DISCONNECTED_XPATH = "//div[contains(.,'Usted ha cerrado con éxito su sesión.')]";
const ONLINE_TIME_SELECTOR = '#onlineTime';
const AVAILABLE_TIME_SELECTOR = '#availableTime';

module.exports = class NautaLoginManagerPuppeteer {
  /**
   *
   * @param {{username: string, password: string}} credentials credentials
   * @param {boolean} [headless=true] headless
   * @param {number} [pupTimeout=4000] pupTimeout
   * @param {Function} [command=null] command
   * @param {{loginURL: string, maxDisconnectionAttempts: number}} [config=null] config
   * @param {import('puppeteer').Browser} [browser=null] browser
   * @throws {TypeError}
   */
  constructor(credentials, headless = true, pupTimeout = 4000,
    command = null, config = null, browser = null) {
    if (!credentials || typeof credentials !== 'object') {
      throw new TypeError('credentials debe ser de tipo Object');
    }
    if (credentials.username && !v.isEmail(`${credentials.username}`)) {
      throw new TypeError('credentials.username debe ser un email');
    }
    if (credentials.password && `${credentials.password}`.length < 3) {
      throw new TypeError('credentials.password debe tener al menos 3 caracteres');
    }
    if (typeof headless !== 'boolean') {
      throw new TypeError('headless debe ser de tipo boolean');
    }
    if (typeof pupTimeout !== 'number') {
      throw new TypeError('pupTimeout debe ser de tipo number');
    }
    if (command) {
      if (typeof command !== 'function') {
        throw new TypeError('command debe ser de tipo function o null');
      }
      this.#command = command;
    }
    if (config) {
      if (typeof config !== 'object') {
        throw new TypeError('config debe ser de tipo object o null');
      }
      if (config.loginURL) {
        // eslint-disable-next-line prefer-template
        if (!v.isURL(config.loginURL + '')) {
          throw new TypeError('config.loginURL debe ser una url');
        }
        this.#loginURL = config.loginURL;
      }
      if (config.maxDisconnectionAttempts) {
        if (!v.isInt(`${config.maxDisconnectionAttempts}`)) {
          throw new TypeError('config.maxDisconnectionAttempts debe ser un entero');
        }
        this.#maxDisconnectionAttempts = config.maxDisconnectionAttempts;
      }
    }
    if (browser) {
      // FIXME: if (typeof browser !== 'object' || !(browser instanceof Browser)) {
      if (typeof browser !== 'object') {
        throw new TypeError('browser debe ser de tipo object');
      }
      this.#browser = browser;
    }
    this.#credentials = Object.freeze(credentials);
    this.#headless = headless;
    this.#pupTimeout = pupTimeout;

    if (!process.env.NODE_ENV.includes('prod')) this.#setupForTest();
  }

  #setupForTest = () => {
    this.constructorPrivateFields = {
      credentials: this.#credentials,
      headless: this.#headless,
      pupTimeout: this.#pupTimeout,
      command: this.#command,
      loginURL: this.#loginURL,
      browser: this.#browser,
      maxDisconnectionAttempts: this.#maxDisconnectionAttempts
    };
  }

  /**
   * @type {import('puppeteer').Browser}
   */
  #browser = null;

  /**
   * @type {import('puppeteer').Page}
   */
  #page = null;

  /**
   * @type {Function}
   */
  #command = () => 0;

  /**
   * @type {number}
   */
  #pupTimeout = 4000;

  /**
   * @type {boolean}
   */
  #headless = true;

  /**
   * @type {{ username: string, password: string }}
   */
  #credentials = null;

  /**
   * @type {string}
   */
  #loginURL = LOGIN_URL;

  /**
   * @type {number}
   */
  #maxDisconnectionAttempts = 0;

  /**
   * @type {number}
   */
  #disconnectionAttempts = 0;


  /**
   * @returns {Promise<void>} returns
   */
  #closePage = async () => {
    if (this.#page != null && !this.#page.isClosed()) {
      await this.#page.close();
    }
    this.#page = null;
    this.#disconnectionAttempts = 0;
  }

  /**
   * @returns {Promise<void>} returns
   */
  #launchBrowser = async () => {
    if (this.#browser == null || !this.#browser.isConnected()) {
      this.#browser = await puppeteer.launch({
        headless: this.#headless
      });
    }
  }

  /**
   * @returns {{code: string, message: string}} returns
   */
  async toggle() {
    if (this.sessionOpen()) {
      return this.disconnet();
    }
    return this.connet();
  }

  /**
   * @returns {{code: string, message: string}} returns
   */
  async connet() {
    const cout = await this.#command();
    if (cout !== 0) {
      return { code: cout.code, message: cout.message };
    }
    if (this.sessionOpen()) {
      return { code: 'SESION_ABIERTA', message: 'Tiene una sesión abierta, pruebe cerrarla' };
    }
    await this.#launchBrowser();
    await this.#closePage();
    this.#page = await this.#browser.newPage();

    let dialogMessage = null;
    const onDialogHandler = async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    };
    this.#page.on('dialog', onDialogHandler);
    try {
      await this.#page.goto(this.#loginURL, { timeout: this.#pupTimeout });
      await this.#page.waitForSelector(USERNAME_SELECTOR, { timeout: this.#pupTimeout });
      await this.#page.click(USERNAME_SELECTOR);
      await this.#page.keyboard.type(this.#credentials.username);
      await this.#page.click(PASSWORD_SELECTOR);
      await this.#page.keyboard.type(this.#credentials.password);
      await Promise.all([
        this.#page.waitForNavigation({ timeout: this.#pupTimeout }),
        this.#page.click(BUTTON_CONNECT_SELECTOR)
      ]);
    } catch (error) {
      // cuando se muestra un dialog error en el cliente, no se produce
      // navegación, y se lanza el error Navigation timeout, en este caso
      // en vez de mostrar este error, se muestra el mensaje del dialog
      // en la sentencia condicional posterior a esta
      if (dialogMessage == null) {
        await this.#closePage();
        return { code: 'ERROR', message: error.message };
      }
    }
    if (dialogMessage !== null) {
      await this.#closePage();
      return { code: 'ERROR_DIALOG', message: dialogMessage };
    }
    const connected = (await this.#page.$x(LABEL_CONNECTED_XPATH)).length > 0;
    if (!connected) {
      await this.#closePage();
    }
    if (this.#page) {
      // hay q ejecutar esto antes de salir sin cerrar la página
      this.#page.removeListener('dialog', onDialogHandler);
    }
    return connected
      ? { code: 'CONECTADO', message: 'Conectado a internet' }
      : { code: 'CONEXION_FALLIDA', message: 'No se ha podido conectar a internet' };
  }

  /**
   * @returns {{code: string, message: string}} returns
   */
  async disconnet() {
    if (!this.sessionOpen()) {
      return { code: 'SIN_SESION', message: 'Usted no tiene sesión abierta que cerrar' };
    }
    const inConnectedPage = (await this.#page.$x(LABEL_CONNECTED_XPATH)).length > 0;
    if (!inConnectedPage) {
      await this.#closePage();
      return {
        code: 'DESCONEXION_FALLIDA',
        message: 'No se pudo desconectar, se ha perdido el control de la sesión'
      };
    }

    let errmessage = '';
    const onDialogHandler = async (dialog) => {
      // se ignora el mensaje de confirmación para desconexión,
      // aparte de este todos los demás son mensajes de error
      if (!dialog.message().includes('Se le desconectará.')) {
        errmessage = dialog.message();
      }
      await dialog.accept();
    };
    if (this.#page.listenerCount('dialog') === 0) {
      this.#page.on('dialog', onDialogHandler);
    }

    let onlineTime = '';
    let availableTime = '';
    try {
      onlineTime = await ppnc.page.innerText(this.#page, ONLINE_TIME_SELECTOR);
      availableTime = await ppnc.page.innerText(this.#page, AVAILABLE_TIME_SELECTOR);
      await Promise.all([
        this.#page.waitForNavigation({ timeout: this.#pupTimeout }),
        this.#page.click(BUTTON_DISCONNET_SELECTOR),
      ]);
    } catch (error) {
      if (!errmessage) {
        errmessage = error.message;
      }
    }
    // SI se desconectó correctamente, cierra página, informa. SALIDA
    const disconneted = (await this.#page.$x(LABEL_DISCONNECTED_XPATH)).length > 0;
    if (disconneted) {
      await this.#closePage();
      return {
        code: 'DESCONECTADO',
        message: `Desconectado, tenias: ${availableTime}, consumiste: ${onlineTime}`
      };
    }
    // SI no se desconectó y quedan intentos de desconexión, informa. SALIDA
    const availableAttempts = this.#maxDisconnectionAttempts - this.#disconnectionAttempts++;
    if (availableAttempts > 0) {
      return {
        code: 'DESCONEXION_INTENTO_FALLIDO',
        message: `No se ha podido desconectar${errmessage ? `: ${errmessage}` : ''}, puede intentar ${availableAttempts} ${availableAttempts === 1 ? 'vez' : 'veces'} mas`
      };
    }
    // SI no quedan intentos de desconexión, cierra página, informa. SALIDA
    await this.#closePage();
    return {
      code: 'DESCONEXION_ULTIMO_INTENTO_FALLIDO',
      message: `No se ha podido desconectar${errmessage ? `: ${errmessage}` : ''}, se ha perdido el control de la sesión`
    };
  }

  // /**
  //  * @returns {Promise<boolean>} returns
  //  */
  // async sessionOpen() {
  //   try {
  //     return this.#page != null && !this.#page.isClosed()
  //     && (await this.#page.$x(LABEL_CONNECTED_XPATH)).length > 0;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  /**
   * @returns {boolean} returns
   */
  sessionOpen() {
    return this.#page != null && !this.#page.isClosed();
  }
};
