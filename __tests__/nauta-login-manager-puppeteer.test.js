/* eslint-disable no-new */
const puppeteer = require('puppeteer');
const NautaLoginManagerPuppeteer = require('../src/nauta-login-manager-puppeteer');
const config = require('../etc/config');
// Setup data
// Setup mocks
// Exercise, Verify state
// Setup expectations, Verify exp..
// Teardown

const { loginURL } = config.nauta_login;
const { timeout } = config;

describe('InternetLoginPuppeteerService', () => {
  describe('constructor', () => {
    test('parámetro credentials es null -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer(null);
      }).toThrow('credentials debe ser de tipo Object');
    });
    test('parámetro credentials es 1 -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer(1);
      }).toThrow('credentials debe ser de tipo Object');
    });
    test('parámetro credentials.username es undefined -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer({});
      }).toThrow('credentials.username debe ser un email');
    });
    test('parámetro credentials.username es 1 -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer({ username: 1 });
      }).toThrow('credentials.username debe ser un email');
    });
    test('parámetro credentials.password es undefined -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer({ username: 'user@email.com' });
      }).toThrow('credentials.password debe tener al menos 3 caracteres');
    });
    test('parámetro credentials.password es 1 -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer({ username: 'user@email.com', password: 1 });
      }).toThrow('credentials.password debe tener al menos 3 caracteres');
    });

    test('parámetro headless es 1 -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer({ username: 'user@email.com', password: 'pass' }, 1);
      }).toThrow('headless debe ser de tipo boolean');
    });

    test('parámetro pupTimeout es null -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer({ username: 'user@email.com', password: 'pass' }, false, null);
      }).toThrow('pupTimeout debe ser de tipo number');
    });

    test('parámetro command es 1 -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer({ username: 'user@email.com', password: 'pass' }, false, 1, 1);
      }).toThrow('command debe ser de tipo function o null');
    });

    test('parámetro config es 1 -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer({ username: 'user@email.com', password: 'pass' }, false, 1, null, 1);
      }).toThrow('config debe ser de tipo object o null');
    });

    test('parámetro config.loginURL es 1 -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer({ username: 'user@email.com', password: 'pass' }, false, 1, null, { loginURL: 1 });
      }).toThrow('config.loginURL debe ser una url');
    });

    test('parámetro browser es 1 -> lanza excepción', () => {
      expect(() => {
        new NautaLoginManagerPuppeteer({ username: 'user@email.com', password: 'pass' }, false, 1, null, { loginURL: 'http://u.com' }, 1);
      }).toThrow('browser debe ser de tipo object');
    });

    test('variables de clase inicializadas correctamente', () => {
      const values = {
        credentials: { username: 'user@email.com', password: 'pass' },
        headless: false,
        pupTimeout: 4000,
        command: () => 1,
        loginURL: 'http://u.com',
        browser: {}
      };
      const nlm = new NautaLoginManagerPuppeteer(
        values.credentials, values.headless, values.pupTimeout,
        values.command, { loginURL: values.loginURL }, values.browser
      );
      expect(nlm.constructorPrivateFields).toEqual(values);
    });
  });

  /**
   * El objetivo de este test es garantizar que cuando se ejecute la
   * función en producción funcione correctamente.
   *
   * Estrategia:
   * se va a hacer un fake del portal nauta login de etecsa y se va a utilizar
   * este en las pruebas de los métodos
   */
  describe(`utilizando puppeteer: ${loginURL}`, () => {
    /**
     * @type {import('puppeteer').Browser}
     */
    let browser = null;

    beforeEach(async () => {
      browser = await puppeteer.launch({ headless: config.headless });
    });
    afterEach(async () => {
      await browser.close();
    });
    /**
     * @param {string} [username='user@nauta.com.cu'] user
     * @param {string} [loginU=loginURL] loginURL
     * @param {number} [timeo] timeout
     * @returns {NautaLoginManagerPuppeteer} SUT
     */
    function newSUT(username = config.creds.username,
      loginU = config.nauta_login.loginURL, timeo = config.timeout) {
      const creds = { username, password: config.creds.password };
      return new NautaLoginManagerPuppeteer(
        creds, config.headless, timeo, () => 0, { loginURL: loginU }, browser
      );
    }

    describe('connet():{code: string, message: string}', () => {
      test('función command no retorna 0 -> connect retorna lo mismo', async () => {
        // Setup data
        const out = { code: 1, message: 'm' };
        const command = () => out;
        const nlm = new NautaLoginManagerPuppeteer(
          { username: 'user@email.com', password: 'pass' }, true, timeout, command, null, browser
        );
        // Exercise, Verify state
        await expect(nlm.connet()).resolves.toEqual(out);
        // Verify state
        await expect(browser.pages()).resolves.toHaveLength(1);
      });

      test('login url sin servicio ->  retorna obj de error', async () => {
        // Setup data
        const nlm = newSUT('user@email.com', 'http://127.0.0.1:9001');
        // Exercise, Verify state
        const out = { code: 'ERROR', message: 'net::ERR_CONNECTION_REFUSED at http://127.0.0.1:9001' };
        await expect(nlm.connet()).resolves.toEqual(out);
        // Verify state
        await expect(browser.pages()).resolves.toHaveLength(1);
        // Teardown
      });

      test('usuario sin saldo ->  retorna obj de error', async () => {
        // Setup data
        // según el usuario se simula el caso
        const nlm = newSUT('nosaldo@nauta.com.cu');
        // Exercise, Verify state
        const res = { code: 'ERROR_DIALOG', message: 'Su cuenta no tiene saldo' };
        await expect(nlm.connet()).resolves.toEqual(res);
        // Verify state
        return expect(browser.pages()).resolves.toHaveLength(1);
      });

      test('datos correctos ->  usuario conectado', async () => {
        // Setup data
        const nlm = newSUT();
        // Exercise, Verify state
        const res = { code: 'CONECTADO', message: 'Conectado a internet' };
        await expect(nlm.connet()).resolves.toEqual(res);
        // Verify state
        return expect(browser.pages()).resolves.toHaveLength(2);
      });

      test('sesión abierta ->  retorna mensaje', async () => {
        // Setup data
        // según el usuario se simula el caso
        const nlm = newSUT();
        // Exercise
        await nlm.connet();
        // Verify state
        const res = { code: 'SESION_ABIERTA', message: 'Tiene una sesión abierta, pruebe cerrarla' };
        await expect(nlm.connet()).resolves.toEqual(res);
        return expect(browser.pages()).resolves.toHaveLength(2);
      });

      test('conexión fallida', async () => {
        // Setup data
        // según el usuario se simula el caso
        const nlm = newSUT('conexionfallida@nauta.com.cu');
        // Exercise, Verify state
        const res = { code: 'CONEXION_FALLIDA', message: 'No se ha podido conectar a internet' };
        await expect(nlm.connet()).resolves.toEqual(res);
        // Verify state
        return expect(browser.pages()).resolves.toHaveLength(1);
      });
    });
    describe('sessionOpen():{boolean}', () => {
      test('sesión abierta -> retorna true ', async () => {
        // Setup data
        const nlm = newSUT();
        // Exercise
        await nlm.connet();
        // Verify
        await expect(nlm.sessionOpen()).resolves.toBeTruthy();
        // Verify state
        return expect(browser.pages()).resolves.toHaveLength(2);
      });
      test('sin sesión -> retorna false', async () => {
        // Setup data
        const nlm = newSUT();
        // Exercise, Verify
        await expect(nlm.sessionOpen()).resolves.toBeFalsy();
        return expect(browser.pages()).resolves.toHaveLength(1);
      });
    });
    describe('disconnect():{code:string, message:string}', () => {
      test('sin sesión abierta -> retorna mensaje de aviso', async () => {
        // Setup data
        const nlm = newSUT();
        // Exercise, Verify
        const res = { code: 'SIN_SESION', message: 'Usted no tiene sesión abierta que cerrar' };
        await expect(nlm.disconnet()).resolves.toEqual(res);
        return expect(browser.pages()).resolves.toHaveLength(1);
      });
      test('browser lanza dialog con mensaje de error que no produce navegación al aceptarse -> error timeout ', async () => {
        // Setup data
        const nlm = newSUT('unreachable-server@nauta.com.cu', loginURL, config.timeout);
        // Exercise, Verify
        const resc = { code: 'CONECTADO', message: 'Conectado a internet' };
        await expect(nlm.connet()).resolves.toEqual(resc);
        // Verify
        const resd = { code: 'ERROR', message: `Navigation timeout of ${config.timeout} ms exceeded` };
        await expect(nlm.disconnet()).resolves.toEqual(resd);
        return expect(browser.pages()).resolves.toHaveLength(1);
      });
      test('la sesión no se cierra -> desconexión fallida', async () => {
        // Setup data
        const nlm = newSUT('desconexion-fallida@nauta.com.cu');
        // Exercise, Verify
        const resc = { code: 'CONECTADO', message: 'Conectado a internet' };
        await expect(nlm.connet()).resolves.toEqual(resc);
        // Verify
        const resd = { code: 'DESCONEXION_FALLIDA', message: 'No se ha podido desconectar de internet' };
        await expect(nlm.disconnet()).resolves.toEqual(resd);
        return expect(browser.pages()).resolves.toHaveLength(1);
      });
      test('la sesión se cierra -> desconectado', async () => {
        // Setup data
        const nlm = newSUT();
        // Exercise, Verify
        const resc = { code: 'CONECTADO', message: 'Conectado a internet' };
        await expect(nlm.connet()).resolves.toEqual(resc);
        // Verify
        const resd = { code: 'DESCONECTADO', message: 'Desconectado, tenias: 01:00:00, consumiste: 00:10:00' };
        await expect(nlm.disconnet()).resolves.toEqual(resd);
        return expect(browser.pages()).resolves.toHaveLength(1);
      });
    });
  });
});