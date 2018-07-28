const logger = require('logger').logger;
const path = require('path');

const io = require('ws_server').io;
const toursLib = require('libs/tours');

const sendUpdateUserCompanies = require('emits_io/auth').sendUpdateCompanies;

const getPlaceById = toursLib.places.getById;
const getPlacesByCompany = toursLib.places.getByCompany;

const prefix = path.basename(__filename, '.js');

const getSubscribePath = require('ws_server').routeAndEmitFunct.getSubscribePathCreator(prefix);
const getEventPath = require('ws_server').routeAndEmitFunct.getEventPathCreator(prefix);


function sendCompanyPlaceList(id, companyId = null) {

	let roomName = null;
	const eventPath = getEventPath('setCompanyPlaceList');

	Promise.resolve()
		.then(() => {
			if (companyId !== null) {
				return;
			}

			return getPlaceById(id).then(place => {
				companyId = place.company.toString();
			});
		})
		.then(() => {
			roomName = `${getSubscribePath(SUBSCRIBE_COMPANY_PLACE_LIST)}/${companyId}`;
			return getPlacesByCompany(companyId); //TODO: optimize update
		})
		.then(result => {
			if (result.status === 'error') {
				throw result.message;
			}

			const places = result.results;

			logger.debug(`Send update place list, size ${Object.keys(places).length}`);

			logger.debug('Send subscribe SUBSCRIBE_COMPANY_PLACE_LIST');
			io.to(roomName).emit(eventPath, { places, companyId });
		})
		.catch(err => {
			logger.error(err);
		});
};

const toursLibSpeaker = toursLib.speaker;
const SPEAKER_EV_CREATE_PLACE = toursLib.SPEAKER_EV_CREATE_PLACE;
const SPEAKER_EV_UPDATE_PLACE = toursLib.SPEAKER_EV_UPDATE_PLACE;
const SPEAKER_EV_DELETE_PLACE = toursLib.SPEAKER_EV_DELETE_PLACE;

toursLibSpeaker.on(SPEAKER_EV_CREATE_PLACE, sendCompanyPlaceList);
toursLibSpeaker.on(SPEAKER_EV_UPDATE_PLACE, sendCompanyPlaceList);
toursLibSpeaker.on(SPEAKER_EV_DELETE_PLACE, sendCompanyPlaceList);

//subscribe
const SUBSCRIBE_COMPANY_PLACE_LIST = 'SUBSCRIBE_COMPANY_PLACE_LIST';

function subscribe(socket, subscribeName, payload = {}) {
	let roomName = getSubscribePath(subscribeName); //use const

	if (subscribeName === SUBSCRIBE_COMPANY_PLACE_LIST) {
		roomName += `/${payload.companyId}`;
	}

	if (!socket.rooms[roomName]) {
		socket.join(roomName);
	}
}

function unsubscribe(socket, subscribeName) {
	logger.warn( 'unsubscribe in dev');
}

module.exports.SUBSCRIBE_COMPANY_PLACE_LIST = SUBSCRIBE_COMPANY_PLACE_LIST;

module.exports.subscribe = subscribe;
module.exports.unsubscribe = unsubscribe;
//companySubscribe.subscribe(socket, SUBSCRIBE_PLACE_LIST, { companyId });