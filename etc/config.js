require('dotenv').config();

const env = process.env.NODE_ENV;

const dev = {
  port: parseInt(process.env.PORT, 10) || 3000,
  headless: process.env.HEADLESS || false,
  creds: {
    username: process.env.NAUTA_USER,
    password: process.env.NAUTA_PASSWORD
  }
};

const prod = {
  port: parseInt(process.env.PORT, 10) || 4500,
  headless: process.env.HEADLESS || true,
  creds: {
    username: process.env.NAUTA_USER,
    password: process.env.NAUTA_PASSWORD
  }
};

const config = {
  dev,
  prod
};

module.exports = config[env];
