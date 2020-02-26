const util = require('util');
const exec = util.promisify(require('child_process').exec);

// eslint-disable-next-line camelcase
module.exports = async function prepare_m5_dhcp() {
  try {
    await exec('bash ./commands/prepare_m5_dhcp.bash');
  } catch (error) {
    return { code: error.code, message: error.stderr };
  }
  return 0;
};
