const logger = require('logger').logger;
const sendToSid = require('./index.js').sendToSid;
const sendToUid = require('./index.js').sendToUid;
const getPrivProfile = require('libs/users').getPrivProfile;
const getUserCompanies = require('libs/company').getUserCompanies;
const getAuthList = require('libs/auth').getAuthList;

const prefix = 'auth';

function sendAuthList(uid, sid) {
	return Promise.resolve()
		.then(() => getAuthList(uid))
		.then((authList) => {
			logger.debug(`trying to send authList to ${sid}`);
			return sendToSid(`/api/${prefix}/authlist`, authList, sid);
		});
};

function sendStatus(uid, sid) {
	return Promise.resolve()
		.then(() => {

			const payload = {
				isGuest: true
				, user: {}
				, companies: {}
			};

			if (uid) {
				const proms = [
					getPrivProfile(uid)
					, getUserCompanies(uid)
				];

				return Promise.all(proms).then((result) => {
					const user = result[0];
					const companies = result[1];

					payload.isGuest = false;
					payload.user = user;
					payload.companies = companies;

					return payload;
				});
			}

			return payload;
		})
		.then((payload) => {
			logger.debug(`send user status to sid ${sid}. isGuest: ${payload.isGuest}, uid: ${payload.user.id}`);
			sendToSid(`/api/${prefix}/status`, payload, sid);
		});
};

function sendAuthResult(isSuccess, sid) {
	return Promise.resolve()
		.then(() => {
			const payload = { isSuccess };
			sendToSid(`/api/${prefix}/result`, payload, sid);
		});
};

function sendSignupResults (result, sid) {
	return (Promise.resolve()
		.then(() => {
			sendToSid(`/api/${prefix}/signupresult`, result, sid);
		})

	);
};

function sendUpdateCompanies(uid) {
	getUserCompanies(uid).then(companies => {
		const payload = {
			companies
		};

		logger.debug(`send update user companies, uid: ${uid}`);
		sendToUid(`/api/${prefix}/companies`, payload, uid);
	})
};

module.exports.sendAuthList = sendAuthList;
module.exports.sendStatus = sendStatus;
module.exports.sendAuthResult = sendAuthResult;
module.exports.sendSignupResults = sendSignupResults;
module.exports.sendUpdateCompanies = sendUpdateCompanies;
