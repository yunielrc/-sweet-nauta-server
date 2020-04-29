const request = require('supertest');
const express = require('express');
const { PushMessage } = require('../src/push-message');
const { resc: RestartAirOsDHCP_, RestartAirOsDHCP } = require('../src/commands/restart-airos-dhcp');
const { NautaSessionManagerMultiUser } = require('../src/nauta-session-manager-multi-user');
const App = require('../src/app');
// 1 Setup data
// 2 Setup mocks
// 3 Exercise, Verify state
// 4 Setup expectations, Verify exp..
// 5 Teardown
jest.mock('../src/push-message');
jest.mock('../src/commands/restart-airos-dhcp');
jest.mock('../src/nauta-session-manager-multi-user');

describe('app', () => {
  const config = { hasAirOS: false };
  const app = express();
  const pushmsg = new PushMessage();
  const restartAirOS = new RestartAirOsDHCP();
  const nsmmu = new NautaSessionManagerMultiUser();

  App.setup({
    config, app, nsmmu, pushmsg, restartAirOS
  });

  beforeEach(() => {
    config.hasAirOS = false;
    jest.resetAllMocks();
  });

  describe('GET /isconnected', () => {
    test('should respond true', async () => {
      nsmmu.isConnected
        .mockReturnValueOnce(true);

      const res = await request(app).get('/isconnected');

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(true);
    });
  });

  describe('GET /connect/:clientID', () => {
    test('should respond msg', async () => {
      const expres = {
        code: 0,
        message: 'msg'
      };
      nsmmu.connect
        .mockResolvedValueOnce(expres);

      const clientID = 'c1';
      const res = await request(app).get(`/connect/${clientID}`);

      expect(restartAirOS.run).not
        .toHaveBeenCalled();
      expect(nsmmu.isConnected).not
        .toHaveBeenCalled();
      expect(nsmmu.connect).toHaveBeenCalledWith(clientID);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(expres);
    });
    test('should respond error', async () => {
      nsmmu.connect
        .mockRejectedValueOnce(new Error('err'));
      const expres = {
        code: 12,
        message: 'err'
      };
      const clientID = 'c1';
      const res = await request(app).get(`/connect/${clientID}`);

      expect(nsmmu.connect).toHaveBeenCalledWith(clientID);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual(expres);
    });
    describe('airOSHandler', () => {
      test('should restart airOS device successfully', async () => {
        config.hasAirOS = true;
        nsmmu.isConnected.mockReturnValueOnce(false);

        restartAirOS.run.mockImplementationOnce((callback) => {
          callback();
          return { code: RestartAirOsDHCP_.DHCP_RESTART_OK, message: 'dhcp reiniciado' };
        });
        const expres = {
          code: 0,
          message: 'msg'
        };
        nsmmu.connect
          .mockResolvedValueOnce(expres);

        const clientID = 'c1';
        const pushmsgSend = 'Reiniciando sesión dhcp, estará listo aproximadamente en 14s';

        const res = await request(app).get(`/connect/${clientID}`);

        expect(restartAirOS.run).toHaveBeenCalledTimes(1);
        expect(pushmsg.send)
          .toHaveBeenCalledWith(clientID, pushmsgSend);
        expect(nsmmu.connect).toHaveBeenCalledWith(clientID);

        expect(res.body).toEqual(expres);
      });
      test('should fail to restart airOS device', async () => {
        config.hasAirOS = true;
        nsmmu.isConnected.mockReturnValueOnce(false);

        const expres = {
          code: RestartAirOsDHCP_.AIROS_UNREACHABLE,
          message: 'airos unreachable'
        };
        restartAirOS.run.mockImplementationOnce(() => expres);

        const res = await request(app).get('/connect/c1');

        expect(restartAirOS.run).toHaveBeenCalledTimes(1);
        expect(nsmmu.connect).not.toHaveBeenCalled();
        expect(res.body).toEqual(expres);
      });
    });
  });
  describe('GET /disconnect/:clientID', () => {
    test('should respond msg', async () => {
      const expres = {
        code: 0,
        message: 'msg'
      };
      nsmmu.disconnect
        .mockResolvedValueOnce(expres);

      const clientID = 'c1';
      const res = await request(app).get(`/disconnect/${clientID}`);

      expect(nsmmu.disconnect).toHaveBeenCalledWith(clientID);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(expres);
    });
    test('should respond error', async () => {
      nsmmu.disconnect
        .mockRejectedValueOnce(new Error('err'));
      const expres = {
        code: 13,
        message: 'err'
      };
      const clientID = 'c1';
      const res = await request(app).get(`/disconnect/${clientID}`);

      expect(nsmmu.disconnect).toHaveBeenCalledWith(clientID);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual(expres);
    });
  });
  describe('GET /toggle/:clientID', () => {
    test('should respond msg', async () => {
      const expres = {
        code: 0,
        message: 'msg'
      };
      nsmmu.toggle
        .mockResolvedValueOnce(expres);

      const clientID = 'c1';
      const res = await request(app).get(`/toggle/${clientID}`);

      expect(nsmmu.toggle).toHaveBeenCalledWith(clientID);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(expres);
    });
    test('should respond error', async () => {
      nsmmu.toggle
        .mockRejectedValueOnce(new Error('err'));
      const expres = {
        code: 14,
        message: 'err'
      };
      const clientID = 'c1';
      const res = await request(app).get(`/toggle/${clientID}`);

      expect(nsmmu.toggle).toHaveBeenCalledWith(clientID);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual(expres);
    });
  });
});
