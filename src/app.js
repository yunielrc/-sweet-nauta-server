const express = require('express');
const credentials = require('../etc/credentials');
const InternetEtecsaLoginService = require('./internet-login-service');

const app = express();
const port = process.env.PORT || 4500;
const iconn = new InternetEtecsaLoginService(credentials, false);

app.get('/toggle', (req, res) => {
  iconn.toggle()
    .then((result) => res.status(200).send(result))
    .catch((err) => res.status(400).send(String(err)));
});

app.get('/connect', (req, res) => {
  iconn.connet()
    .then((result) => res.status(200).send(result))
    .catch((err) => res.status(400).send(String(err)));
});

app.get('/disconnect', (req, res) => {
  iconn.disconnet()
    .then((result) => res.status(200).send(result))
    .catch((err) => res.status(400).send(String(err)));
});

app.get('/session-open', (req, res) => {
  iconn.sessionOpen()
    .then((result) => res.status(200).send(result))
    .catch((err) => res.status(400).send(String(err)));
});

app.get('/close-browser', (req, res) => {
  iconn.closeBrowser()
    .then((result) => res.status(200).send(result))
    .catch((err) => res.status(400).send(String(err)));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${port}`);
});
