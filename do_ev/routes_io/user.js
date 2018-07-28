const logger = require('logger').logger;
const io = require('ws_server').io;
const ss = require('socket.io-stream');
const filesLib = require('libs/files');
const usersLib = require('libs/users');
const isGuest = require('./index').isGuest;


const path = 'user';

io.on('connection', (socket) => {

	socket.on('/api/subscribe/profile', (data) => {
		const uid = data.uid;
		socket.join(`subscribe/profile/uid_${uid}`);
		logger.debug(`WS ${socket.id} subscribe: profile/uid_${uid}`);
	});

	socket.on('/api/unsubscribe/profile', (data) => {
		const uid = data.uid;
		socket.leave(`subscribe/profile/uid_${uid}`);
		logger.debug(`WS ${socket.id} unsubscribe: profile/uid_${uid}`);
	});

	socket.on(`/api/${path}/updateProfile`, (data, cb) => {
		let uid = null;

		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			uid = socket.handshake.session.passport.user;
		}
		logger.debug(`/api/${path}/updateProfile called: ${data} `);
		if (uid) usersLib.updateUser(uid, data, 'user_fullProfile')
			.then(() => {
				return (cb({ error: null }));
			})
			.catch((err) => {
				return (cb({ error: err }));
			});

	});

	socket.on(`/api/${path}/updateAvatar`, (data, cb) => {
		let uid = null;

		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			uid = socket.handshake.session.passport.user;
		}
		logger.debug(`/api/${path}/updateAvatar called: ${data} `);
		if (uid) return usersLib.updateAvatar(uid, data, 'user_fullProfile')
			.then(() => {
				return (cb({ err: null }));
			})
			.catch((err) => {
				return (cb({ err }));
			});

	});
});
