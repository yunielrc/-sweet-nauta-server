const express = require('express');
const config = require('../etc/config');
const { NautaSessionManager } = require('./nauta-session-manager');
const { NautaSessionManagerMultiUser } = require('./nauta-session-manager-multi-user');

const app = express();
let command;
if (config.beforeConnect) {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  command = require(`../commands/${config.beforeConnect}`);
}
const nsm = new NautaSessionManager(
  config.creds, config.headless, config.timeout, command, config.nautaSessionManager
);
const nsmmu = new NautaSessionManagerMultiUser(
  nsm, config.nautaSessionManagerMultiUser
);

app.get('/toggle/:clientID', async (req, res) => {
  try {
    const { clientID } = req.params;
    const result = await nsmmu.toggle(clientID);
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send(String(error));
  }
});

app.get('/connect/:clientID', async (req, res) => {
  try {
    const { clientID } = req.params;
    const result = await nsmmu.connet(clientID);
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send(String(error));
  }
});

app.get('/disconnect/:clientID', async (req, res) => {
  try {
    const { clientID } = req.params;
    const result = await nsmmu.disconnet(clientID);
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send(String(error));
  }
});

app.get('/isconnected', async (req, res) => {
  try {
    const result = await nsmmu.isConnected();
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send(String(error));
  }
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${config.port}`);
});
