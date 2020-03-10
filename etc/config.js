require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  headless: process.env.HEADLESS || false,
  creds: {
    username: process.env.NAUTA_USER,
    password: process.env.NAUTA_PASSWORD
  },
  airos_roter_ip: process.env.AIROS_ROUTER_IP,
  before_connect: process.env.BEFORE_CONNECT || null
};

Object.freeze(config);
module.exports = config;
