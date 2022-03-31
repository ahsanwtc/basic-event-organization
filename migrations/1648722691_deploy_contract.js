const EventContract = artifacts.require('EventContract');

module.exports = function(_deployer) {
  _deployer.deploy(EventContract);
};
