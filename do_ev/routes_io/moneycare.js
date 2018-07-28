const logger = require('logger').logger;
const io = require('ws_server').io;
const moneycareLib = require('libs/moneycare');

const path = 'moneycare';

io.on('connection', (socket) => {

	socket.on(`/api/${path}/getoffers`, (data, cb) => {

		logger.debug(socket.handshake.session.passport);
		logger.debug(socket.handshake.session.passport.user);
		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			if (data.price && data.birthday) {
				moneycareLib.getOffers(data.birthday, data.price)
					.then((data) => {
						return cb(
							{
								error: null
								, data
							}
						);
					})
					.catch((err) => {
						logger.error(`Err getoffers: ${err.message}`);
						return cb(
							{
								error: err
								, data: null
							}
						);
					});
			}
		} else {
			return cb(
				{
					error: 'no user in session!'
					, data: null
				}
			);
		}
	});

});
