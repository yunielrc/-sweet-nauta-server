const Ajv = require('ajv');
const { NautaSessionManager } = require('./nauta-session-manager');

const constant = {
  CLIENT_ID_PATTERN: '^([0-9]|[a-z]|[A-Z]|[.-])+$'
};

const resc = {
  CONNECT_ERROR_CLIENT_ID_FORMAT: 'CONNECT_ERROR_CLIENT_ID_FORMAT',
  DISCONNECT_ERROR_CLIENT_ID_FORMAT: 'DISCONNECT_ERROR_CLIENT_ID_FORMAT',
  DISCONNECT_ERROR_OWNER: 'DISCONNECT_ERROR_OTHER_OWNER'
};

// eslint-disable-next-line jsdoc/require-param
/**
 * Controls that only the user who initiates the connection
 * can finish it, except the owner which may terminate the
 * connection initiated by another user
 */
class NautaSessionManagerMultiUser {
  /**
   *
   * @param {NautaSessionManager} nsm nauta session manager
   * @param {object} config nautaSessionManagerMultiUser
   */
  constructor(nsm, config) {
    this.#setNsm(nsm);
    this.#setConfig(config);
  }

  /**
   * @type {import('ajv').Ajv}
   */
  #ajv = new Ajv();

  /**
   * @type {NautaSessionManager}
   */
  #nsm = null;

  /**
   * @param {NautaSessionManager} nsm nauta session manager
   */
  #setNsm = (nsm) => {
    if (typeof nsm !== 'object' || !(nsm instanceof NautaSessionManager)) {
      throw new TypeError('`parameter` nsm must be of type `NautaSessionManager`');
    }
    this.#nsm = nsm;
  };


  /**
   * @type {string[]}
   */
  #masters = [];

  /**
   * @param {string} config config
   * @throws error if config is invalid
   */
  #setConfig = (config) => {
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema',
      type: 'object',
      required: [
        'masters'
      ],
      properties: {
        masters: {
          type: 'array',
          maxItems: 5,
          uniqueItems: true,
          items: {
            type: 'string',
            pattern: constant.CLIENT_ID_PATTERN
          }
        }
      }
    };
    // const validate = this.#ajv.compile(schema);
    if (!this.#ajv.validate(schema, config)) {
      const err = this.#ajv.errors[0];
      throw new Error(`data: ${err.dataPath}, path: ${err.schemaPath} - ${err.message}`);
    }
    this.#masters = config.masters;
  };

  /**
   * @type {string}
   */
  #owner = null;

  /**
   * @type {string}
   */
  get owner() {
    return this.#owner;
  }

  /**
   * @param {string} clientID clientID
   * @returns {boolean} returns
   */
  static isValidClientID(clientID) { return typeof clientID === 'string' && clientID.match(constant.CLIENT_ID_PATTERN); }

  /**
   * @returns {boolean} returns
   */
  #hasOwner = () => this.#owner !== null;

  /**
   * @param {string} clientID clientID
   * @returns {boolean} returns
   */
  #isOwner = (clientID) => this.#owner === clientID;

  /**
   * @param {string} clientID clientID
   * @returns {boolean} returns
   */
  #isMaster = (clientID) => this.#masters.includes(clientID);


  #releaseOwner = () => { this.#owner = null; };

  /**
   *
   * @param {string} clientID clientID
   * @returns {Promise<{code: string, message: string}>} returns
   */
  async connet(clientID) {
    if (!NautaSessionManagerMultiUser.isValidClientID(clientID)) {
      return {
        code: resc.CONNECT_ERROR_CLIENT_ID_FORMAT,
        message: `client id format must be ${constant.CLIENT_ID_PATTERN}`
      };
    }
    if (!this.#hasOwner()) {
      this.#owner = clientID;
    }
    const res = await this.#nsm.connet();
    // if it was not connected then releases the owner
    if (!this.isConnected()) {
      this.#releaseOwner();
    }
    return res;
  }

  /**
   * Ensures that only the user who initiated the connection can
   * disconnect it
   *
   * @param {string} clientID clientID
   * @returns {Promise<{code: string, message: string}>} returns
   */
  async disconnet(clientID) {
    if (!NautaSessionManagerMultiUser.isValidClientID(clientID)) {
      return {
        code: resc.DISCONNECT_ERROR_CLIENT_ID_FORMAT,
        message: `client id format must be ${constant.CLIENT_ID_PATTERN}`
      };
    }
    /**
     * only the owner or master can closes the session
     */
    if (this.#hasOwner() && !this.#isOwner(clientID)
        && !this.#isMaster(clientID)) {
      return {
        code: resc.DISCONNECT_ERROR_OWNER,
        message: 'No se pudo desconectar, otro usuario inició la conexión y posee el control de la sesión'
      };
    }
    const res = await this.#nsm.disconnet();
    // if it was disconnected then releases the owner
    if (!this.isConnected()) {
      this.#releaseOwner();
    }
    return res;
  }

  /**
   * @param {string} clientID clientID
   * @returns {Promise<{code: string, message: string}>} returns
   */
  async toggle(clientID) {
    if (this.isConnected()) {
      return this.disconnet(clientID);
    }
    return this.connet(clientID);
  }

  /**
   * @returns {boolean} returns
   */
  isConnected() {
    return this.#nsm.isConnected();
  }
}

Object.freeze(resc);
module.exports = { resc, constant, NautaSessionManagerMultiUser };
