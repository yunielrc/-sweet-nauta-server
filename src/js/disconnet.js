const InternetEtecsaLoginService = require('./internet-etecsa-login-service');

const ilogin = new InternetEtecsaLoginService();

(async () => {
  console.log(await ilogin.disconnet());
})();


