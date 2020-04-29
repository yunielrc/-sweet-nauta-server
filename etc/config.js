require('dotenv').config();

const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 4500,
  },
  app: {
    hasAirOS: process.env.AIROS_IP !== undefined,
    // eslint-disable-next-line eqeqeq
    sendPushMsg: process.env.SEND_PUSH_MSG == 'true'
  },
  restartAirOsDHCP: {
    airosIP: process.env.AIROS_IP || null,
    wanhost: 'secure.etecsa.net'
  },
  nautaSessionManager: {
    headless: process.env.HEADLESS !== 'false',
    creds: {
      username: process.env.NAUTA_USER,
      password: process.env.NAUTA_PASSWORD
    },
    loginURL: process.env.LOGIN_URL || null,
    timeout: parseInt(process.env.TIMEOUT, 10) || 8000,
    maxDisconnectionAttempts: parseInt(process.env.MAX_DISCONNECTION_ATTEMPTS, 10) || 2
  },
  nautaSessionManagerMultiUser: {
    masters: process.env.MASTERS ? process.env.MASTERS.replace(/\s/g, '').split(',') : []
  },
  pushMessage: {
    wss: {
      port: parseInt(process.env.WSS_PORT, 10) || 8181,
    }
  }
};

Object.freeze(config);
module.exports = config;
