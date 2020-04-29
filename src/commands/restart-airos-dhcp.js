const util = require('util');
const exec = util.promisify(require('child_process').exec);
const Ajv = require('ajv');

const resc = {
  AIROS_UNREACHABLE: 'AIROS_UNREACHABLE',
  AIROS_READY: 'AIROS_READY',
  CALL_BACK_ERROR: 'CALL_BACK_ERROR',
  DHCP_RESTART_ERROR: 'DHCP_RESTART_ERROR',
  DHCP_RESTART_OK: 'DHCP_RESTART_OK'
};

/**
 * Restart the AirOS device dhcp client session if wanhost is unreachable
 */
class RestartAirOsDHCP {
  /**
   *
   * @param {{airosIP:string, wanhost:string}} config config
   */
  constructor(config) {
    this.#setConfig(config);
  }

  /**
   * @type {import('ajv').Ajv}
   */
  #ajv = new Ajv();

  /**
   * @type {string}
   */
  #airosIP = '';

  /**
   * @type {string}
   */
  #wanhost = '';

  /**
   * @param {object} config config
   * @throws error if config is invalid
   */
  #setConfig = (config) => {
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema',
      type: 'object',
      required: [
        'airosIP',
        'wanhost'
      ],
      properties: {
        airosIP: {
          type: 'string',
          format: 'ipv4'
        },
        wanhost: {
          type: 'string',
          format: 'hostname'
        }
      },
      additionalProperties: false
    };

    if (!this.#ajv.validate(schema, config)) {
      const err = this.#ajv.errors[0];
      throw new Error(`data: ${err.dataPath}, path: ${err.schemaPath} - ${err.message}`);
    }
    this.#airosIP = config.airosIP;
    this.#wanhost = config.wanhost;
  };

  /**
   *
   * @param {Function} preRestartCallback  pre restart callback function
   * @returns {Promise<{code:number, message:string}>} return
   */
  async run(preRestartCallback = null) {
    try {
      await exec(`timeout 2 ping -c 1 ${this.#airosIP}`);
    } catch (error) {
      // if AirOS device isn't available, exit
      return { code: resc.AIROS_UNREACHABLE, message: 'ERROR: Router inalcanzable' };
    }
    try {
      await exec(`timeout 2 ping -c 1 ${this.#wanhost}`);
      // if nauta authentication service is available, exit
      return { code: resc.AIROS_READY, message: 'Dispositivo AirOS listo' };
    // eslint-disable-next-line no-empty
    } catch (error) {
    }

    if (preRestartCallback !== null) {
      if (!(preRestartCallback instanceof Function)) {
        throw new TypeError('parameter `preRestartCallback` must be a function');
      }
      try {
        preRestartCallback();
      } catch (error) {
        return { code: resc.CALL_BACK_ERROR, message: error.message };
      }
    }

    try {
      await exec(`ssh -o 'ConnectTimeout=2' \
      -o 'BatchMode=yes' \
      -o 'UserKnownHostsFile=/dev/null' \
      -o 'StrictHostKeyChecking=no' \
      ubnt@${this.#airosIP} -- \
      udhcpc -f -q -n -i ath0 -s /etc/udhcpc/udhcpc renew`);
    } catch (error) {
      return { code: resc.DHCP_RESTART_ERROR, message: error.stderr };
    }
    return { code: resc.DHCP_RESTART_OK, message: 'Dispositivo AirOS list, cliente dhcp reiniciado' };
  }
}

Object.freeze(resc);
module.exports = { resc, RestartAirOsDHCP };
