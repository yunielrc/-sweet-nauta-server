/**
 * Conecta y desconecta el acceso a internet por wifi etecsa
 */
const {
  Builder,
  By,
  until,
  Capabilities,
} = require('selenium-webdriver');
const ping = require('ping');

module.exports = class InternetEtecsaLoginService {
  constructor() {
    this.driver = null;
  }

  createDriver() {
    // el headless no funciona cuando el navegador está abierto previamente
    // a la apertura de la ventana, por ello se va a buscar otra alternativa
    // a selenium, además de que un navegador headless reduce dependencias
    // y brinda una solución más compacta.
    const chromeCapabilities = Capabilities.chrome();
    chromeCapabilities.set('chromeOptions', { args: ['--headless'] });

    this.driver = new Builder()
      .forBrowser('chrome')
      .withCapabilities(chromeCapabilities)
      .build();
  }

  async toggle() {
    if (await this.isConnected()) {
      return this.disconnet();
    }
    return this.connet();
  }

  async connet() {
    // el ping se omite por optimización
    // if (await this.isConnected()) {
    //   throw new Error('ERR_CURRENTLY_CONNECTED');
    // }
    if (this.driver === null) {
      // se crea la primera ventana del navegador
      this.createDriver();
      // se abre la página de login
      await this.driver.get('https://secure.etecsa.net:8443/');
    } else {
      try {
        // en este caso la ventana debe estar creada
        // si está conectado se sale
        const elements = await this.driver.findElements(By.xpath("//span[contains(.,'Usted está conectado')]"));
        if (elements.length > 0) {
          return { code: 'VENTANA_CONEXION_ESTABLECIDA', message: 'Ventana de conexión establecida abierta' };
        }
        // de no estar conectado se conecta
        // si da error en este paso puede ser que el usuario haya cerrado la ventana,
        // en este caso en el catch se abre otra nueva
        await this.driver.get('https://secure.etecsa.net:8443/');
      } catch (error) {
        // se abre una nueva ventana
        this.createDriver();
        await this.driver.get('https://secure.etecsa.net:8443/');
      }
    }
    await this.driver.findElement(By.id('username')).sendKeys('yuniel.roque@nauta.com.cu');
    await this.driver.findElement(By.id('password')).sendKeys('U4mjdnkRikgf4p2/');
    await this.driver.findElement(By.name('Enviar')).click();
    await this.driver.wait(until.elementLocated(By.xpath("//span[contains(.,'Usted está conectado')]")), 2000);

    return (await this.driver.findElements(By.xpath("//span[contains(.,'Usted está conectado')]"))).length > 0
      ? { code: 'CONEXION_EXITOSA', message: 'Conectado a internet' }
      : { code: 'CONEXION_FALLIDA', message: 'No se ha podido conectar a internet' };
  }

  async disconnet() {
    // si está desconectado no se hace nada y se informa al usuario
    if (!await this.isConnected()) {
      return { code: 'SIN_CONEXION', message: 'Usted no está conectado a internet' };
    }
    // de estar conectado pero no encontrarse la ventana de conexión establecida,
    // no se hace nada y se informa al usuario
    try {
      if (this.driver === null
        || (await this.driver.findElements(By.xpath("//span[contains(.,'Usted está conectado')]"))).length === 0) {
        return { code: 'VENTANA_CONEXION_NO_ENCONTRADA', message: 'Ventana de conexión no encontrada.' };
      }
    } catch (error) {
      return { code: 'VENTANA_CONEXION_NO_ENCONTRADA', message: 'Ventana de conexión no encontrada.' };
    }
    await this.driver.findElement(By.name('logout')).click();
    await this.driver.switchTo().alert().accept();
    await this.driver.wait(until.elementLocated(By.css('.info-white1')), 2000);
    // eslint-disable-next-line max-len
    // return (await this.driver.findElement(By.css('.info-white1'))).getText() === 'Usted ha cerrado con éxito su sesión.'
    return !await this.isConnected()
      ? { code: 'DESCONEXION_EXITOSA', message: 'Se ha desconectado de internet' }
      : { code: 'DESCONEXION_FALLIDA', message: 'No se ha podido desconectar de internet' };
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
