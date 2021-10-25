const idtLogger = require('shefcon-dev-idt-node-logger');
const pkg = require('../../package.json');

module.exports = () => idtLogger(pkg);
