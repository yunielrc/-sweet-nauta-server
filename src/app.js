const express = require('express');
const config = require('../etc/config');
const InternetLoginPuppeteerService = require('./internet-login-puppeteer-service');

const app = express();
let command;
if (config.before_connect) {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  command = require(`../commands/${config.before_connect}`);
}
const iconn = new InternetLoginPuppeteerService(config.creds, config.headless, 8000, command);

app.get('/toggle', async (req, res) => {
  try {
    const result = await iconn.toggle();
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send(String(error));
  }
});

app.get('/connect', async (req, res) => {
  try {
    const result = await iconn.connet();
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send(String(error));
  }
});

app.get('/disconnect', async (req, res) => {
  try {
    const result = await iconn.disconnet();
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send(String(error));
  }
});

app.get('/session-open', async (req, res) => {
  try {
    const result = await iconn.sessionOpen();
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send(String(error));
  }
});

app.get('/close-browser', async (req, res) => {
  try {
    const result = await iconn.closeBrowser();
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send(String(error));
  }
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${config.port}`);
});
