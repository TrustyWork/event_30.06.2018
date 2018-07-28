const logger = require('logger').logger;
const app = require('http_server');
const socketIo = require('socket.io');
const sessionMW = require('storage').sessionMW;
const sessionStore = require('storage').sessionMW.store;
const maintenance = require('maintenance');
const maintenanceEmit = require('emits_io/maintenance');
const emitsIo = require('emits_io/');
//const messagesEmit = require('emits_io/message');
const getUser = require('libs/users').getUser;

module.exports.init = (server) => Promise.resolve().then(() => {
	const io = socketIo(server);
	module.exports.io = io;

	io.use((socket, next) => {
		logger.debug(`WS use, maintenance status: ${maintenance.active}`);
		if (!maintenance.active) {
			next();
			return;
		}

		const err = new Error('Server in maintenance mode, it will take no more than 15 minutes.');
		next(err);
	});

	io.use((socket, next) => {
		sessionMW.mw(socket.handshake, {}, next);
	});

	io.use((socket, next) => {

		if (!socket.handshake.session) {

			return next(new Error('No session found'));
		}

		next();
	});


	io.on('connection', (socket) => {

		logger.debug(`socket ${socket.id} connected`);

		const sessionRoom = `sid_${socket.handshake.session.id}`;
		const socketSid = socket.handshake.session.id;
		let userRoom = null;


		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			let uid = socket.handshake.session.passport.user;
			userRoom = `uid_${uid}`;
			socket.join(userRoom);
			logger.debug(`WS ${socket.id} Joined userRoom: ${userRoom}`);

			getUser(uid).then(user => {
				const roles = user.roles;

				if (roles.indexOf('global_admin') !== -1) {
					socket.join('global_admin');
					logger.debug(`WS ${socket.id} Joined global_admin room`);
				}
			});
		}

		socket.join(sessionRoom);
		logger.debug(`WS ${socket.id} Joined sessionRoomR: ${sessionRoom}`);

		//called when session store updates.
		const updateRooms = (updatedStoreSid) => {

			//check if it our socket?
			if (updatedStoreSid === socketSid) {
				logger.debug(`UpdateRooms due to store change called. WS:${socket.id} sid:${socketSid}`);

				// update session in socket
				socket.handshake.session.reload((err) => {
					if (err) { logger.error(err); return; }
					logger.debug(`WS ${socket.id} session reloaded. session:${socket.handshake.session.id} user: ${socket.handshake.session.passport.user}`);
					if (socket.handshake.session.passport && `uid_${socket.handshake.session.passport.user}` !== userRoom) {

						logger.debug(`changing WS ${socket.id} user room from ${userRoom} to uid_${socket.handshake.session.passport.user}`);
						socket.leave(userRoom);
						if (socket.handshake.session.passport.user) {
							userRoom = `uid_${socket.handshake.session.passport.user}`;
							socket.join(userRoom);
						}
					}
				});
			}

			return null;
		};

		sessionStore.on('update', updateRooms);


		socket.on('disconnect', (reason) => {
			sessionStore.removeListener('update', updateRooms);
			return logger.debug(`disconnect: ${socket.id} ${reason}`);
		});


		if (maintenance.active) {
			maintenanceEmit;
		}
	});
	return true;
});

module.exports.initEmits = () => Promise.resolve().then(() => {
	emitsIo.init();
});

module.exports.initRoutes = () => Promise.resolve().then(() => {
	//subscribe
	require('subscribe_io/company');
	require('subscribe_io/tourPlace');
	require('subscribe_io/tourPatterns');

	//routes
	require('routes_io/user');
	require('routes_io/users');
	require('routes_io/auth');
	require('routes_io/geo');
	require('routes_io/file');
	require('routes_io/moneycare');
	require('routes_io/company');
	require('routes_io/tourPlace');
	require('routes_io/tourPatterns');
	require('routes_io/tours');

	//emits
	require('emits_io/message');
});


function getEventPathCreator(prefix) {
	return (eventName) => {
		const path = `/api/${prefix}/${eventName}`;
		return path;
	}
}

function getSubscribePathCreator(prefix, eventName) {
	return (eventName) => {
		const path = `/api/subscribe/${prefix}/${eventName}`;
		return path;
	}
}

module.exports.routeAndEmitFunct = {};
module.exports.routeAndEmitFunct.getEventPathCreator = getEventPathCreator;
module.exports.routeAndEmitFunct.getSubscribePathCreator = getSubscribePathCreator;