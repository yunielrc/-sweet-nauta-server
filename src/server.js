const WebSocket = require('ws');
const express = require('express');
const config = require('../etc/config');
const { NautaSessionManager } = require('./nauta-session-manager');
const { NautaSessionManagerMultiUser } = require('./nauta-session-manager-multi-user');
const { PushMessage } = require('./push-message');
const { RestartAirOsDHCP } = require('./commands/restart-airos-dhcp');
const App = require('./app');

const app = express();
const pushmsg = new PushMessage(
  new WebSocket.Server(config.pushMessage.wss)
);
const restartAirOS = (config.app.hasAirOS) ? new RestartAirOsDHCP(config.restartAirOsDHCP) : null;
const nsmmu = new NautaSessionManagerMultiUser(
  new NautaSessionManager(
    config.nautaSessionManager.creds,
    config.nautaSessionManager.headless,
    config.nautaSessionManager.timeout,
    () => 0, config.nautaSessionManager
  ),
  config.nautaSessionManagerMultiUser
);

App.setup({
  config: config.app, app, nsmmu, pushmsg, restartAirOS
});

app.listen(config.server.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${config.server.port}`);
  // eslint-disable-next-line no-console
  console.log(`WSS running on port: ${config.pushMessage.wss.port}`);
});
