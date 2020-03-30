require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 4500,
  headless: process.env.HEADLESS !== 'false',
  creds: {
    username: process.env.NAUTA_USER,
    password: process.env.NAUTA_PASSWORD
  },
  airosRouterIP: process.env.AIROS_ROUTER_IP || null,
  beforeConnect: process.env.BEFORE_CONNECT || null,
  timeout: parseInt(process.env.TIMEOUT, 10) || 8000,
  nautaSessionManager: {
    loginURL: process.env.LOGIN_URL || null,
    maxDisconnectionAttempts: parseInt(process.env.MAX_DISCONNECTION_ATTEMPTS, 10) || 2
  },
  nautaSessionManagerMultiUser: {
    masters: process.env.MASTERS ? process.env.MASTERS.replace(/\s/g, '').split(',') : []
  }
};

Object.freeze(config);
module.exports = config;
