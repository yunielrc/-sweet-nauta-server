import InternetLoginPuppeteerService from '../src/internet-login-puppeteer-service';
import config from '../etc/config';

let command;
if (config.before_connect) {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  command = require(`../commands/${config.before_connect}`);
}
const iconn = new InternetLoginPuppeteerService(config.creds, config.headless, 8000, command);

describe('InternetLoginPuppeteerService', () => {
  describe('method(param:type):type', () => {
    test('status condition -> result ', () => {
      
    });
  });
});
