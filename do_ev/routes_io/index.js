module.exports.isGuest = (socket) => {
	if (
		socket.handshake.session &&
		socket.handshake.session.passport &&
		socket.handshake.session.passport.user
	) {
		return true;
	}
	return false;
};
