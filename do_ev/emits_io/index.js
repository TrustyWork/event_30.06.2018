const ws_server = require('ws_server');
const logger = require('logger').logger;

let io = null;

module.exports.init = () => {
	io = ws_server.io;
}

function sendToAll(path, data) { 
	return new Promise((res, rej) => {

		io.emit(path, data);
		res(path, data);
	});
}


function sendToUid(path, data, uid) {
	return new Promise((res, rej) => {


		// if (typeof uid !== 'string') {
		// 	if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
		// 		uid = socket.handshake.session.passport.user;
		// 	} else {
		// 		rej(new Error('The socket does not belong to an authorized user'));
		// 	}
		// }

		const room = `uid_${uid}`;

		io.to(room).emit(path, data);
		res(path, data, uid);
	});
}

function sendToSid(path, data, sid) {
	return new Promise((res, rej) => {

		if (typeof sid !== 'string') {
			sid = sid.handshake.session.id;
		}

		const room = `sid_${sid}`;
		io.to(room).emit(path, data);

		res(path, data, sid);
	});
}

function sendToGlobalAdmins(path, data) {
	return new Promise((res, rej) => {

		const room = 'global_admin';
		io.to(room).emit(path, data);

		res(path, data);
	});
}

module.exports.sendToAll = sendToAll;
module.exports.sendToUid = sendToUid;
module.exports.sendToSid = sendToSid;
module.exports.sendToGlobalAdmin = sendToGlobalAdmins;
