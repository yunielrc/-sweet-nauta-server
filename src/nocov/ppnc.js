
module.exports.page = {

  /**
   *
   * @param {import('puppeteer').Page} page page
   * @param {string} selector selector
   * @returns {string} innerText
   */
  innerText: async (page, selector) => page.$eval(selector, (el) => el.innerText),
};
