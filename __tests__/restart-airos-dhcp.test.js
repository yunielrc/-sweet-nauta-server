const { resc, RestartAirOsDHCP } = require('../src/commands/restart-airos-dhcp');
// 1 Setup data
// 2 Setup mocks
// 3 Exercise, Verify state
// 4 Setup expectations, Verify exp..
// 5 Teardown
/**
 *
 * @param {{airosIP:string, wanhost:string}} conf config
 * @returns {RestartAirOsDHCP} sut
 */
function sut(conf) {
  return new RestartAirOsDHCP(conf);
}

describe('RestartAirOsDHCP', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });
  describe('constructor', () => {
    describe('setConfig', () => {
      test('param `airOS` invalid, should throws error', () => {
        expect(() => {
          sut({});
        }).toThrow(/should have required property 'airosIP'/);
        expect(() => {
          sut({ airosIP: '' });
        }).toThrow(/should match format "ipv4"/);
        expect(() => {
          sut({ airosIP: '192.168.1' });
        }).toThrow(/should match format "ipv4"/);
      });

      test('param `wanhost` invalid, should throws error ', () => {
        const airosIP = '192.168.0.100';
        // const wanhost = '';
        expect(() => {
          sut({ airosIP });
        }).toThrow(/should have required property 'wanhost'/);
        expect(() => {
          sut({ airosIP, wanhost: '' });
        }).toThrow(/should match format "hostname"/);
        expect(() => {
          sut({ airosIP, wanhost: 'invalidh#ost' });
        }).toThrow(/should match format "hostname"/);
      });
    });
  });
  describe('run', () => {
    test('should return code `AIROS_UNREACHABLE`', () => {
      const airosIP = '192.168.0.100';
      const wanhost = 'hostdown';

      const expres = { code: resc.AIROS_UNREACHABLE, message: 'ERROR: Router inalcanzable' };

      return expect(
        sut({ airosIP, wanhost }).run()
      ).resolves.toEqual(expres);
    });

    test('should return code `AIROS_READY`', () => {
      const airosIP = '127.0.0.1';
      const wanhost = 'localhost';

      const expres = { code: resc.AIROS_READY, message: 'Dispositivo AirOS listo' };

      return expect(
        sut({ airosIP, wanhost }).run()
      ).resolves.toEqual(expres);
    });

    test('preRestartCallback is not a function should throw an error', () => {
      const airosIP = '127.0.0.1';
      const wanhost = '3localhost';

      const expres = new TypeError('parameter `preRestartCallback` must be a function');

      return expect(
        sut({ airosIP, wanhost }).run(1)
      ).rejects.toEqual(expres);
    });

    test('on preRestartCallback error should return `CALL_BACK_ERROR`', () => {
      const airosIP = '127.0.0.1';
      const wanhost = '3localhost';

      const errmessage = 'callback error';
      const preRestartCallback = () => {
        throw new Error(errmessage);
      };
      const expres = { code: resc.CALL_BACK_ERROR, message: errmessage };

      return expect(
        sut({ airosIP, wanhost }).run(preRestartCallback)
      ).resolves.toEqual(expres);
    });

    test('show return `DHCP_RESTART_ERROR`', async () => {
      const airosIP = '127.0.0.1';
      const wanhost = '3localhost';
      const preRestartCallback = () => true;
      const expres = resc.DHCP_RESTART_ERROR;

      expect(
        (await sut({ airosIP, wanhost }).run(preRestartCallback)).code
      ).toBe(expres);
    });

    test('should return `DHCP_RESTART_OK`', async () => {
      const airosIP = '127.0.0.1';
      const wanhost = '3localhost';
      const preRestartCallback = () => true;

      const mock = jest.fn()
        .mockImplementationOnce(async () => 0)
        .mockImplementationOnce(async () => { throw new Error(); })
        .mockImplementationOnce(async () => 0);

      jest.doMock('util', () => ({
        promisify: () => mock
      }));
      // eslint-disable-next-line global-require
      const { RestartAirOsDHCP: RestartAirOsDHCPm } = require('../src/commands/restart-airos-dhcp');

      const expres = { code: resc.DHCP_RESTART_OK, message: 'Dispositivo AirOS list, cliente dhcp reiniciado' };

      await expect(
        new RestartAirOsDHCPm({ airosIP, wanhost }).run(preRestartCallback)
      ).resolves.toEqual(expres);

      expect(mock).toHaveBeenCalledTimes(3);
    });
  });
});
