const express = require('express');
const InternetEtecsaLoginService = require('./internet-etecsa-login-service');

const app = express();
const port = process.env.PORT || 4500;
const iconn = new InternetEtecsaLoginService();

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

app.get('/isconnected', (req, res) => {
  iconn.isConnected()
    .then((result) => res.status(200).send(result))
    .catch((err) => res.status(400).send(String(err)));
});

app.listen(port, () => {
  console.log('Server running on port 3000');
});
