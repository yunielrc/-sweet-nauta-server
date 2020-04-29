const WebSocket = require('ws');
const { resc, PushMessage } = require('../src/push-message');

const serverPort = 8888;
const serverAddress = `ws://localhost:${serverPort}`;
const wsClientID = 'c1';
const wsAddress = `${serverAddress}?clientID=${wsClientID}`;

// 1 Setup data
// 2 Setup mocks
// 3 Exercise, Verify state
// 4 Setup expectations, Verify exp..
// 5 Teardown

describe('PushMessage', () => {
/**
 * @param {import('ws').Server} wss websocket server
 * @returns {PushMessage} sut
 */
  function sut(wss) {
    return new PushMessage(wss);
  }
  /**
   * @param {object} options wss options
   * @returns {Promise<import('ws').Server>} wss
   */
  async function collaborator(options = { port: serverPort }) {
    const wss = new WebSocket.Server(options);
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
      wss.on('listening', () => {
        resolve(wss);
      });
    });
  }
  /**
   * @param {string} address ws adress
   * @returns {import('ws')} ws
   */
  function newWSClient(address = wsAddress) {
    return new WebSocket(address);
  }

  /**
   * @type {import('ws').Server}
   */
  let wss = null;

  /**
   * @type {Map<string,WebSocket>}
   */
  let map = null;

  /**
   * @type {PushMessage}
   */
  let pm = null;

  beforeEach(async () => {
    wss = await collaborator();
    jest.restoreAllMocks();
    map = new Map();
    jest.spyOn(global, 'Map').mockImplementation(
      () => map
    );
    pm = sut(wss);
  });

  afterEach(async () => {
    // eslint-disable-next-line no-unused-vars
    await new Promise((resolve, reject) => {
      wss.close(() => {
        resolve(true);
      });
    });
  });

  describe('constructor', () => {
    describe('setWss', () => {
      test('parameter wss isn\'t WebSocket.Server -> throws error', async () => {
        expect(() => {
          sut(1);
        }).toThrow(/must be of type `WebSocket.Server/);
        expect(() => {
          sut({});
        }).toThrow(/must be of type `WebSocket.Server/);
      });

      test('ws with parameter clientID missing -> sends msg required', async () => {
        const addressWithoutClientID = serverAddress;
        const ws = newWSClient(addressWithoutClientID);
        const res = {
          code: resc.CONNECTION_ERROR_CLIENT_ID_REQUIRED,
          message: '`parameter` clientID required'
        };
        return expect(
          // eslint-disable-next-line no-unused-vars
          new Promise((resolve, reject) => {
            ws.on('message', (data) => {
              resolve(JSON.parse(data));
            });
          })
        ).resolves.toEqual(res);
      });

      test('map.delete should be called once on ws close', async () => {
        map.delete = jest.fn();
        const ws = newWSClient();
        let clientID = null;
        // eslint-disable-next-line no-unused-vars
        await new Promise((resolve, reject) => {
          ws.on('open', () => {
            map.delete.mockImplementationOnce(
              // eslint-disable-next-line no-unused-vars
              (arg) => {
                clientID = arg;
                resolve(true);
              }
            );
            ws.close();
          });
        });
        // need to wait until delete is called
        expect(map.delete).toHaveBeenCalledTimes(1);
        expect(clientID).toBe(wsClientID);
      });

      test('map.set should be called once', async () => {
        map.set = jest.fn();
        newWSClient();
        // eslint-disable-next-line no-unused-vars
        await new Promise((resolve, reject) => {
          map.set.mockImplementationOnce(
            // eslint-disable-next-line no-unused-vars
            (clientID, ws) => resolve(true)
          );
        });
        expect(map.set).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('send', () => {
    test('should throws error if param message is not string', () => {
      expect(() => {
        pm.send('', 1);
      }).toThrow(/message must be of type `string`/);
    });
    test('should throws error if message is empty', () => {
      expect(() => {
        pm.send('', '');
      }).toThrow(/message must not be empty/);
    });
    test('should throws error if clientID doesn\'t exist', () => {
      expect(() => {
        pm.send('c2', 'message');
      }).toThrow(/doesn't exist/);
    });
    test('should throws error if ws doesn\'t open', async () => {
      const ws = newWSClient();
      const clientID = 'c1';
      // eslint-disable-next-line no-unused-vars
      await new Promise((resolve, reject) => {
        ws.on('open', () => resolve(true));
      });
      const servws = map.get(clientID);
      servws.readyState = 111;

      expect(() => {
        pm.send(clientID, 'message');
      }).toThrow(/WebSocket doesn't open/);
    });

    // eslint-disable-next-line jest/expect-expect
    test('should send a message', async () => {
      const ws = newWSClient();
      const clientID = 'c1';
      const message = 'm1';

      return expect(
        // eslint-disable-next-line no-unused-vars
        new Promise((resolve, reject) => {
          ws.on('open', () => {
            pm.send(clientID, message);
          }).on('message', (data) => {
            resolve(data);
          });
        })
      ).resolves.toEqual(message);
    });
  });
});
