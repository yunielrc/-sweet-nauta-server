/**
 * Conecta y desconecta el acceso a internet por wifi etecsa
 */
const { Builder, By, Key, until, Capabilities } = require('selenium-webdriver');

class InternetEtecsaLoginService {

  constructor() {
     this.driver = new Builder().forBrowser("chrome").build(); 
  }

  async connet() {
    await driver.get("https://secure.etecsa.net:8443/");
  
    await driver.findElement(By.id("username")).sendKeys("yuniel.roque@nauta.com.cu");
    await driver.findElement(By.id("password")).sendKeys("U4mjdnkRikgf4p2/");
    await driver.findElement(By.name("Enviar")).click();
    // let logoutBtn = await driver.findElement(By.name("logout"));
    // driver.executeScript(`
    //   arguments[0].addEventListener('click', () => {
    //   });
    // `, logoutBtn);
  }

  async disconnet(){
    await driver.findElement(By.name("logout")).click();
    await driver.switchTo().alert().accept();
    await driver.close();
  }

  isConnected(){

  }
}