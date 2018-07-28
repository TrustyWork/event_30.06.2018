const io = require('ws_server').io;
const logger = require('logger').logger;
const getPubProfile = require('libs/users').getPubProfile;
const findUserByEmail = require('libs/users').findUserByEmail;
const findUser = require('libs/users').findUser;
const path = 'users';

io.on('connection', (socket) => {

	socket.on(`/api/${path}/users`, (data, cb) => {
		logger.debug('Users profiles requested');

		if (!data || !data.payload) { return cb({ err: 'Empty request', data: null }); }

		const uids = data.payload;

		const answers = uids.map(uid => getPubProfile(uid));

		return Promise.all(answers)
			.then(profiles => cb({ err: null, data: profiles }))
			.catch((err) => {
				logger.warn(err);
				cb({ err, data: null });
			});
	});

	socket.on(`/api/${path}/getProfileByEmail`, (data, cb) => {
		logger.debug('Users getProfileByEmail requested');

		if (!data || !data.payload) { return cb({ err: 'Empty request', data: null }); }

		return findUserByEmail(data.payload)
			.then((user) => cb({ err: null, data: user }))
			.catch((err) => {
				logger.warn(err);
				cb({ err, data: null });
			});
	});

	socket.on(`/api/${path}/findUser`, (data, cb) => {
		logger.debug('Users findUser requested');

		if (!data || !data.payload) { return cb({ err: 'Empty request', data: null }); }

		return findUser(data.payload)
			.then((user) => cb({ err: null, data: user }))
			.catch((err) => {
				logger.warn(err);
				cb({ err, data: null });
			});

	});
});
