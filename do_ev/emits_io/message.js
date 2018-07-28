const logger = require('logger').logger;
const sendToSid = require('./index.js').sendToSid;

const prefix = 'message';

module.exports.formatMessage = function formatMessage(
	type = 'user'
	, from = 'SYSTEM'
	, text = 'empty_message'
	, linkRef = '#'
	, linkText = 'Read more...'
) {

	return (
		{
			type
			, from
			, text
			, linkRef
			, linkText
		}
	);

};

module.exports.msgToSid = function sendStatus(message, sid) {

	sendToSid(`/api/${prefix}/message`, message, sid);

};
