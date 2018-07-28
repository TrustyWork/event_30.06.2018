const logger = require('logger').logger;

const sendToUid = require('./index.js').sendToUid;
const getPrivProfile = require('libs/users').getPrivProfile;

const path = 'companies';

const SUBSCRIBE_UPD_COMPANY_LIST = '/api';

module.exports.updateCompanyList = function updateProfile(uid) {
	return Promise.resolve()
		.then(() => {

			const payload = {
				user: {},
			};

			return getPrivProfile(uid).then((user) => {
				payload.user = user;
				return payload;
			});
		})
		.then((payload) => {
			logger.debug(`send update private profile, uid: ${payload.user.id}`);
			sendToUid(`/api/${prefix}/profile`, payload, sid);
		});
};
