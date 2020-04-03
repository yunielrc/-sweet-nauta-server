const { resc, constant, NautaSessionManagerMultiUser } = require('../src/nauta-session-manager-multi-user');
const { NautaSessionManager } = require('../src/nauta-session-manager');
// mocks collaborator
jest.mock('../src/nauta-session-manager');
// 1 Setup data
// 2 Setup mocks
// 3 Exercise, Verify state
// 4 Setup expectations, Verify exp..
// 5 Teardown
describe('NautaSessionManagerMultiUser', () => {
  /**
   * @param {NautaSessionManagerMultiUser} nsm nsm
   * @param {object} config config
   * @returns {NautaSessionManagerMultiUser} nsmmu
   */
  function sut(nsm, config) {
    return new NautaSessionManagerMultiUser(nsm, config);
  }
  /**
   * @returns {NautaSessionManager} nsm
   */
  function collaborator() {
    const credentials = { username: 'user@mail.com', password: '123' };
    const headless = true;
    const pupTimeout = 1000;
    const command = () => 0;
    const config = { loginURL: 'http://url.com', maxDisconnectionAttempts: 1 };
    const browser = null;

    return new NautaSessionManager(credentials, headless, pupTimeout, command,
      config, browser);
  }
  describe('constructor', () => {
    describe('setNsm', () => {
      test('parameter nsm is null -> should throws error', () => {
        expect(() => {
          sut(null, {});
        }).toThrow(/nsm must be of type `NautaSessionManager`/);
      });
      test('parameter nsm is {} -> should throws error', () => {
        expect(() => {
          sut({}, {});
        }).toThrow(/nsm must be of type `NautaSessionManager`/);
      });
    });
    describe('setConfig', () => {
      test('masters has empty items -> should throws error', () => {
        // 1 Setup data
        const nsm = collaborator();
        const config = { masters: [''] };
        // 3 Exercise, Verify state
        expect(() => {
          sut(nsm, config);
        }).toThrow(`data: .masters[0], path: #/properties/masters/items/pattern - should match pattern "${constant.CLIENT_ID_PATTERN}"`);
      });
      test('masters is empty -> should be ok', () => {
        // 1 Setup data
        const nsm = collaborator();
        const config = { masters: [] };
        // 3 Exercise, Verify state
        expect(() => {
          sut(nsm, config);
        }).not.toThrow();
      });
      test('masters has more than 5 items -> should throws error', () => {
        // 1 Setup data
        const nsm = collaborator();
        const config = { masters: ['1', '2', '3', '4', '5', '6'] };
        // 3 Exercise, Verify state
        expect(() => {
          sut(nsm, config);
        }).toThrow('data: .masters, path: #/properties/masters/maxItems - should NOT have more than 5 items');
      });
      test('masters has numeric items -> should throws error', () => {
        // 1 Setup data
        const nsm = collaborator();
        const config = { masters: [1] };
        // 3 Exercise, Verify state
        expect(() => {
          sut(nsm, config);
        }).toThrow('data: .masters[0], path: #/properties/masters/items/type - should be string');
      });
      test('masters has duplicate items -> should throws error', () => {
        // 1 Setup data
        const nsm = collaborator();
        const config = { masters: ['a', 'b', 'b'] };
        // 3 Exercise, Verify state
        expect(() => {
          sut(nsm, config);
        }).toThrow('data: .masters, path: #/properties/masters/uniqueItems - should NOT have duplicate items (items ## 2 and 1 are identical)');
      });
      test('should be ok', () => {
        // 1 Setup data
        const nsm = collaborator();
        const config = { masters: ['id1', 'id2'] };
        // 3 Exercise, Verify state
        expect(() => {
          sut(nsm, config);
        }).not.toThrow();
      });
    });
  });
  describe('methods', () => {
    /**
     * @type {import('../src/nauta-session-manager')}
     */
    let nsm = null;
    /**
     * @type {import('../src/nauta-session-manager-multi-user')}
     */
    let nsmmu = null;
    const config = { masters: ['master1', 'master2'] };
    const connectRes = {
      code: 'code_connect',
      message: 'message'
    };
    const disconnectRes = {
      code: 'code_disconnect',
      message: 'message'
    };

    beforeEach(() => {
      // Setup data
      nsm = collaborator();
      // Setup mocks
      nsm.connet.mockResolvedValue(connectRes);
      nsm.disconnet.mockResolvedValue(disconnectRes);
      // Setup data
      nsmmu = sut(nsm, config);
    });

    describe('connect', () => {
      test('invalid clientID -> should return CONNECT_ERROR_CLIENT_ID_FORMAT', async () => {
      // 1 Setup data
        const res = {
          code: resc.CONNECT_ERROR_CLIENT_ID_FORMAT,
          message: `client id format must be ${constant.CLIENT_ID_PATTERN}`
        };
        // 2 Setup mocks
        // 3 Exercise, Verify state
        await expect(nsmmu.connet({})).resolves.toEqual(res);
        await expect(nsmmu.connet(null)).resolves.toEqual(res);
        await expect(nsmmu.connet('')).resolves.toEqual(res);
        await expect(nsmmu.connet('/*')).resolves.toEqual(res);
        // 4 Setup expectations, Verify exp..
        // 5 Teardown
      });
      test('should connect and retain owner', async () => {
        // 1 Setup data and mock
        const clientID = 'client1';
        // mock
        nsm.isConnected.mockReturnValueOnce(true);
        // data
        // 3 Exercise, Verify state
        await expect(nsmmu.connet(clientID)).resolves.toEqual(connectRes);
        expect(nsmmu.owner).toBe(clientID);
        // 4 Setup expectations, Verify exp..
        // 5 Teardown
      });
      test('should fail to connect and not retain owner', async () => {
        // 1 Setup data and mock
        const clientID = 'client1';
        // mock
        nsm.isConnected.mockReturnValueOnce(false);
        // 3 Exercise, Verify state
        await expect(nsmmu.connet(clientID)).resolves.toEqual(connectRes);
        expect(nsmmu.owner).toBeNull();
        // 4 Setup expectations, Verify exp..
        // 5 Teardown
      });
      test('if already connected should retain previus owner', async () => {
        // 1 Setup data and mock
        // data
        const clientID = 'client1';
        const clientID2 = 'client2';
        // mock
        nsm.isConnected.mockReturnValue(true);
        // 3 Exercise, Verify state
        await expect(nsmmu.connet(clientID)).resolves.toEqual(connectRes);
        expect(nsmmu.owner).toBe(clientID);
        // second client call
        await expect(nsmmu.connet(clientID2)).resolves.toEqual(connectRes);
        // owner must be client1
        expect(nsmmu.owner).toBe(clientID);
        // 4 Setup expectations, Verify exp..
        // 5 Teardown
      });
    });
    describe('disconnect', () => {
      test('invalid clientID -> DISCONNECT_ERROR_CLIENT_ID_FORMAT', async () => {
        // 1 Setup data
        const res = {
          code: resc.DISCONNECT_ERROR_CLIENT_ID_FORMAT,
          message: `client id format must be ${constant.CLIENT_ID_PATTERN}`
        };
        // 2 Setup mocks
        // 3 Exercise, Verify state
        await expect(nsmmu.disconnet({})).resolves.toEqual(res);
        await expect(nsmmu.disconnet(null)).resolves.toEqual(res);
        await expect(nsmmu.disconnet('')).resolves.toEqual(res);
        await expect(nsmmu.disconnet('/*')).resolves.toEqual(res);
        // 4 Setup expectations, Verify exp..
        // 5 Teardown
      });
      test('if connected and client is not the owner should returns DISCONNECT_ERROR_OWNER', async () => {
        // 1 Setup data and mock
        // data
        const owner = 'client1';
        const clientID = 'client2';
        const res = {
          code: resc.DISCONNECT_ERROR_OWNER,
          message: 'No se pudo desconectar, otro usuario inició la conexión y posee el control de la sesión'
        };
        // mock
        nsm.isConnected.mockReturnValue(true);
        // 3 Exercise, Verify state
        await expect(nsmmu.connet(owner)).resolves.toEqual(connectRes);
        expect(nsmmu.owner).toBe(owner);
        // client2 can't disconnets
        await expect(nsmmu.disconnet(clientID)).resolves.toEqual(res);
        // 5 Teardown
      });
      test('if connected, client is not the owner, but it is master should disconnets', async () => {
        // 1 Setup data and mock
        // data
        const owner = 'client1';
        const clientID = 'master1';
        // mock
        nsm.isConnected.mockReturnValue(true);
        // 3 Exercise, Verify state
        await expect(nsmmu.connet(owner)).resolves.toEqual(connectRes);
        expect(nsmmu.owner).toBe(owner);
        // client2 disconnets
        nsm.isConnected.mockReturnValue(false);
        await expect(nsmmu.disconnet(clientID)).resolves.toEqual(disconnectRes);
        expect(nsmmu.owner).toBeNull();
        // 5 Teardown
      });
      test('if successfully disconnected should release the owner', async () => {
        // 1 Setup data and mock
        // data
        const clientID = 'client1';
        // mock
        nsm.isConnected.mockReturnValue(true);
        // 3 Exercise, Verify state
        await expect(nsmmu.connet(clientID)).resolves.toEqual(connectRes);
        expect(nsmmu.owner).toBe(clientID);

        nsm.isConnected.mockReturnValue(false);
        await expect(nsmmu.disconnet(clientID)).resolves.toEqual(disconnectRes);
        expect(nsmmu.owner).toBeNull();
        // 5 Teardown
      });
      test('if disconnect fails should retains the owner', async () => {
        // 1 Setup data and mock
        // data
        const clientID = 'client1';
        // mock
        nsm.isConnected.mockReturnValue(true);
        // 3 Exercise, Verify state
        await expect(nsmmu.connet(clientID)).resolves.toEqual(connectRes);
        await expect(nsmmu.disconnet(clientID)).resolves.toEqual(disconnectRes);
        expect(nsmmu.owner).toBe(clientID);
        // 5 Teardown
      });
    });
    describe('toggle', () => {
      test('should toggle connection status', async () => {
        // Setup data
        const clientID = 'client1';
        // Setup mock
        nsmmu.connet = jest.fn().mockResolvedValue(connectRes);
        nsmmu.disconnet = jest.fn().mockResolvedValue(disconnectRes);

        nsm.isConnected.mockReturnValueOnce(true);
        // Excercise, Verify
        await expect(nsmmu.toggle(clientID)).resolves.toEqual(disconnectRes);
        // Verify expectations
        expect(nsmmu.connet).not.toHaveBeenCalled();
        expect(nsmmu.disconnet).toHaveBeenCalled();
        // Reset mocks
        nsmmu.connet = jest.fn().mockResolvedValue(connectRes);
        nsmmu.disconnet = jest.fn().mockResolvedValue(disconnectRes);
        // Setup mock
        nsm.isConnected.mockReturnValueOnce(false);
        // Excercise, Verify
        await expect(nsmmu.toggle(clientID)).resolves.toEqual(connectRes);
        // Verify expectations
        expect(nsmmu.connet).toHaveBeenCalled();
        expect(nsmmu.disconnet).not.toHaveBeenCalled();
      });
    });
  });
});
