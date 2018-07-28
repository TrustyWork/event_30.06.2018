const logger = require('logger').logger;
const io = require('ws_server').io;
const ss = require('socket.io-stream');
const filesLib = require('libs/files');

const path = 'file';

io.on('connection', (socket) => {

	ss(socket).on(`/api/${path}/upload`, (stream, data, cb) => {
		if (!data.name || !data.type) {
			return cb({
				err: '!data.name || !data.type'
				, data: null
			});
		}

		logger.debug('New incoming stream for file upload', data);
		filesLib.uploadStream(stream, data)
			.then((data) => {
				return cb({
					err: null
					, data
				});
			})
			.catch((err) => {
				return cb({
					err
					, data: null
				});
			});
	});
});
