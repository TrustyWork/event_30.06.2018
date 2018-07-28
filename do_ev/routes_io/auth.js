const logger = require('logger').logger;
const io = require('ws_server').io;
const sendStatus = require('emits_io/auth').sendStatus;
const sendSignupResults = require('emits_io/auth').sendSignupResults;
const sendAuthList = require('emits_io/auth').sendAuthList;
const AuthModel = require('models/auth');
const delAuthStrategy = require('libs/auth').delAuthStrategy;
const path = 'auth';

io.on('connection', (socket) => {

	socket.on(`/api/${path}/requestpassreset`, (email, cb) => {
		logger.info(`Password reset request for ${email}`);

		return AuthModel.passwordResetbegin(email)
			.then((result) => cb({ result, error: null }))
			.catch((err) => cb({ result: null, error: err }));
	});

	socket.on(`/api/${path}/passreset`, ({ secret, password }, cb) => {
		logger.info(`Trying to change password to ${password} secret is ${secret}`);

		return AuthModel.passwordResetFinish(password, secret)
			.then((result) => cb({ result, error: null }))
			.catch((err) => cb({ result: null, error: err }));
	});


	socket.on(`/api/${path}/delauthrecord`, (provider) => {

		const sid = socket.handshake.session.id;
		logger.debug(`deleting strategy. provider: ${provider}`);
		let uid;
		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			uid = socket.handshake.session.passport.user;
		}
		return (
			delAuthStrategy(uid, provider)
				.then(() => {
					sendAuthList(uid, sid);
				})
		);
	});


	socket.on(`/api/${path}/getauthlist`, () => {

		const sid = socket.handshake.session.id;

		let uid;
		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			uid = socket.handshake.session.passport.user;
		}
		sendAuthList(uid, sid)
			.catch((err) => { logger.error(`something wrong captured in AuthModel.delAuthRecord: ${err}`) })
	});


	socket.on(`/api/${path}/status`, (data) => {
		let uid = null;

		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			uid = socket.handshake.session.passport.user;
		}

		const sid = socket.handshake.session.id;
		sendStatus(uid, sid);
	});

	socket.on(`/api/${path}/register`, (data) => {

		const sid = socket.handshake.session.id;

		AuthModel.registerLocal(
			data.name
			, data.surname
			, data.email
			, data.password
			, data.birthday
		)
			.then((result) => {
				result
					? sendSignupResults({ isSuccess: true, errors: {} }, sid)
					: sendSignupResults({ isSuccess: false, errors: { name: 'Something wrong...' } }, sid);
			});
	});

	socket.on(`/api/${path}/logout`, (data) => {
		let uid = null;

		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			uid = socket.handshake.session.passport.user;
		}

		const sid = socket.handshake.session.id;
		sendStatus(uid, sid);
	});
});
