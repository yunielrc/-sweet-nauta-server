require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  headless: process.env.HEADLESS || false,
  creds: {
    username: process.env.NAUTA_USER,
    password: process.env.NAUTA_PASSWORD
  }
};
