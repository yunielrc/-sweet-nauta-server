const WebSocket = require('ws');

const resc = {
  CONNECTION_ERROR_CLIENT_ID_REQUIRED: 'CONNECTION_ERROR_CLIENT_ID_REQUIRED',
};

/**
 * Sends push messages
 */
class PushMessage {
  /**
   *
   * @param {import('ws').Server} wss websocket server
   */
  constructor(wss) {
    this.#setWss(wss);
  }

  /**
   * @type {Map<string,WebSocket>}
   */
  #map = new Map();

  /**
   * @type {import('ws').Server}
   */
  #wss = null;

  /**
   * @param {import('ws').Server} wss websocket server
   */
  #setWss = (wss) => {
    if (typeof wss !== 'object' || !(wss instanceof WebSocket.Server)) {
      throw new TypeError('`parameter` wss must be of type `WebSocket.Server`');
    }
    this.#wss = wss;

    wss.on('connection', (ws, req) => {
      const clientID = new URL(`http://u.l${req.url}`).searchParams.get('clientID');

      if (!clientID) {
        ws.send(JSON.stringify({
          code: resc.CONNECTION_ERROR_CLIENT_ID_REQUIRED,
          message: '`parameter` clientID required'
        }));
        return;
      }
      this.#map.set(clientID, ws);

      ws.on('close', () => {
        this.#map.delete(clientID);
      });
    });
  };

  /**
   * Send a message to specific client
   *
   * @param {string} clientID client id
   * @param {string} message message
   * @throws will throw an error if `client` id don't exist or `message` is empty
   */
  send(clientID, message) {
    if (typeof message !== 'string') {
      throw new Error('`parameter` message must be of type `string`');
    }
    if (message.trim() === '') {
      throw new Error('`parameter` message must not be empty');
    }
    const ws = this.#map.get(clientID);

    if (!ws) {
      throw new Error(`WebSocket Client '${clientID}' doesn't exist`);
    }
    if (ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Client: ${clientID}, WebSocket doesn't open`);
    }
    ws.send(message);
  }
}

Object.freeze(resc);
module.exports = { resc, PushMessage };
