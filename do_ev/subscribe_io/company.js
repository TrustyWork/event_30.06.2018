const logger = require('logger').logger;
const path = require('path');

const io = require('ws_server').io;
const companyLib = require('libs/company');

const sendUpdateUserCompanies = require('emits_io/auth').sendUpdateCompanies;

const getCompaniesIdAndName = companyLib.getCompaniesIdAndName;
const getCompany = companyLib.getCompany;

const prefix = path.basename(__filename, '.js');

const getSubscribePath = require('ws_server').routeAndEmitFunct.getSubscribePathCreator(prefix);
const getEventPath = require('ws_server').routeAndEmitFunct.getEventPathCreator(prefix);


function sendCompanyList(id) {

	const roomName = getSubscribePath(SUBSCRIBE_COMPANY_LIST);
	const eventPath = getEventPath('setCompanyList');

	return getCompaniesIdAndName().then(companies => {
		logger.debug('Send subscribe SUBSCRIBE_COMPANY_LIST');
		io.to(roomName).emit(eventPath, { companies });
	});
}

function sendUserCompanies(id) {

	getCompany(id).then(company => {
		const uid = company.staff[0].uid;
		sendUpdateUserCompanies(uid);
	});
}

const companyLibSpeaker = companyLib.speaker;
const SPEAKER_EV_CREATE_COMPANY = companyLib.SPEAKER_EV_CREATE_COMPANY;
const SPEAKER_EV_UPDATE_COMPANY = companyLib.SPEAKER_EV_UPDATE_COMPANY;
const SPEAKER_EV_DELETE_COMPANY = companyLib.SPEAKER_EV_DELETE_COMPANY;

companyLibSpeaker.on(SPEAKER_EV_CREATE_COMPANY, sendCompanyList);
companyLibSpeaker.on(SPEAKER_EV_CREATE_COMPANY, sendUserCompanies);

companyLibSpeaker.on(SPEAKER_EV_UPDATE_COMPANY, sendCompanyList);
companyLibSpeaker.on(SPEAKER_EV_UPDATE_COMPANY, sendUserCompanies);

companyLibSpeaker.on(SPEAKER_EV_DELETE_COMPANY, sendCompanyList);


//subscribe
const SUBSCRIBE_COMPANY_LIST = 'SUBSCRIBE_COMPANY_LIST';

function subscribe(socket, subscribeName, payload = {}) {
	const roomName = getSubscribePath(subscribeName); //use const

	if (!socket.rooms[roomName]) {
		socket.join(roomName);
	}
}

function subscribeUser(uid, subscribeName) {
	//TODO
}

function unsubscribe(socket, subscribeName) {
	logger.warn( 'unsubscribe in dev');
}

module.exports.SUBSCRIBE_COMPANY_LIST = SUBSCRIBE_COMPANY_LIST;

module.exports.subscribe = subscribe;
module.exports.unsubscribe = unsubscribe;
