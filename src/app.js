/* eslint-disable max-len */
const { NautaSessionManagerMultiUser } = require('./nauta-session-manager-multi-user');
const { PushMessage } = require('./push-message');
const { resc: RestartAirOsDHCP_, RestartAirOsDHCP } = require('./commands/restart-airos-dhcp');

module.exports = class App {
  /**
   * @type {import('.').App}
   */
  static #instance = null;

  /**
   *
   * @param {{ config:object, app:import('express').Express, nsmmu:NautaSessionManagerMultiUser, pushmsg:PushMessage, restartAirOS: RestartAirOsDHCP }} options options
   * @returns {import('.').App} app
   */
  static setup(options) {
    return new App(options);
  }

  constructor({
    config, app, nsmmu, pushmsg, restartAirOS
  }) {
    if (App.#instance) {
      return App.#instance;
    }
    // TODO validate parameters
    this.#config = config;
    this.#nsmmu = nsmmu;
    this.#pushmsg = pushmsg;
    this.#restartAirOS = restartAirOS;

    this.#setupRoutes(app);
    App.#instance = this;
  }

  /**
   * @type {object}
   */
  #config = null;

  /**
   * @type {import('express').Express}
   */
  #app = null;

  /**
   * @type {NautaSessionManagerMultiUser}
   */
  #nsmmu = null;

  /**
   * @type {PushMessage}
   */
  #pushmsg = null;

  /**
   * @type {RestartAirOsDHCP}
   */
  #restartAirOS = null;

  /**
   * @param {import('express').Request} req req
   * @param {import('express').Response} res res
   * @param {import('express').NextFunction} next next
   */
  #airOSHandler = async (req, res, next) => {
    const { clientID } = req.params;
    if (this.#config.hasAirOS && !this.#nsmmu.isConnected()) {
      const restartAirOSresp = await this.#restartAirOS.run(() => {
        if (this.#pushmsg) {
          this.#pushmsg.send(clientID, 'Reiniciando sesión dhcp, estará listo aproximadamente en 14s');
        }
      });
      if (![RestartAirOsDHCP_.AIROS_READY, RestartAirOsDHCP_.DHCP_RESTART_OK]
        .includes(restartAirOSresp.code)) {
        res.status(200).send(restartAirOSresp);
        return;
      }
    }
    next();
  }

  /**
   * @param {import('express').Express} app app
   */
  #setupRoutes = (app) => {
    app.get('/isconnected', async (req, res) => {
      const result = await this.#nsmmu.isConnected();
      res.status(200).send(result);
    });

    app.get('/connect/:clientID', this.#airOSHandler, async (req, res) => {
      try {
        const { clientID } = req.params;
        const result = await this.#nsmmu.connect(clientID);
        res.status(200).send(result);
      } catch (error) {
        res.status(400).send({
          code: 12,
          message: error.message
        });
      }
    });

    app.get('/disconnect/:clientID', async (req, res) => {
      try {
        const { clientID } = req.params;
        const result = await this.#nsmmu.disconnect(clientID);
        res.status(200).send(result);
      } catch (error) {
        res.status(400).send({
          code: 13,
          message: error.message
        });
      }
    });

    app.get('/toggle/:clientID', this.#airOSHandler, async (req, res) => {
      try {
        const { clientID } = req.params;
        const result = await this.#nsmmu.toggle(clientID);
        res.status(200).send(result);
      } catch (error) {
        res.status(400).send({
          code: 14,
          message: error.message
        });
      }
    });
  };
};
