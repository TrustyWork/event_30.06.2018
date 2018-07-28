const logger = require('logger').logger;
const sendToAll = require('./index').sendToAll;

const path = 'maintenance';

module.exports.start = () => {
	sendToAll(`${path}/start`, {});
};

module.exports.done = () => {
	sendToAll(`${path}/done`, {});
};
