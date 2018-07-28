const logger = require('logger').logger;
const path = require('path');

const io = require('ws_server').io;
const toursLib = require('libs/tours');
const getToursPatternByCompany = toursLib.tourPatterns.getByCompany;
const getTourPatternById = toursLib.tourPatterns.findById;
const makeCuteTourPatterns = toursLib.tourPatterns.makeCute;

const prefix = path.basename(__filename, '.js');

const getEventPath = require('ws_server').routeAndEmitFunct.getEventPathCreator(prefix);
const getSubscribePath = require('ws_server').routeAndEmitFunct.getSubscribePathCreator(prefix);

//subscribe
const SUBSCRIBE_COMPANY_TOUR_PATTERN_LIST = 'SUBSCRIBE_COMPANY_TOUR_PATTERN_LIST';

const sendTourPatternList = (tourPatternId, companyId = null) => {

	let roomName = null;
	const eventPath = getEventPath('setTourPatternList');

	return getTourPatternById(tourPatternId)
		.then(tourPattern => {
			if (companyId !== null) {
				return;
			}

			companyId = tourPattern.company.toString();
		})
		.then(() => {
			roomName = `${getSubscribePath(SUBSCRIBE_COMPANY_TOUR_PATTERN_LIST)}/${companyId}`;
			return getToursPatternByCompany(companyId); //TODO: optimize update
		})
		.then(result => {
			if (result.status === 'error') {
				throw result.message;
			}

			return makeCuteTourPatterns(result.results);
		})
		.then(result => {
			if (result.status === 'error') {
				throw result.message;
			}

			const tourPatterns = result.results;

			logger.debug('Send subscribe SUBSCRIBE_COMPANY_TOUR_PATTERN_LIST');
			io.to(roomName).emit(eventPath, { tourPatterns, companyId });
		})
		.catch(err => {
			logger.error(err);
		});
};

const toursLibSpeaker = toursLib.speaker;
const SPEAKER_EV_CREATE_TOUR_PATTERN = toursLib.SPEAKER_EV_CREATE_TOUR_PATTERN;
const SPEAKER_EV_UPDATE_TOUR_PATTERN = toursLib.SPEAKER_EV_UPDATE_TOUR_PATTERN;
const SPEAKER_EV_DELETE_TOUR_PATTERN = toursLib.SPEAKER_EV_DELETE_TOUR_PATTERN;

toursLibSpeaker.on(SPEAKER_EV_CREATE_TOUR_PATTERN, sendTourPatternList);
toursLibSpeaker.on(SPEAKER_EV_UPDATE_TOUR_PATTERN, sendTourPatternList);
toursLibSpeaker.on(SPEAKER_EV_DELETE_TOUR_PATTERN, sendTourPatternList);

function subscribe(socket, subscribeName, payload = {}) {
	let roomName = getSubscribePath(subscribeName); //use const

	if (subscribeName === SUBSCRIBE_COMPANY_TOUR_PATTERN_LIST) {
		roomName += `/${payload.companyId}`;
	}

	if (!socket.rooms[roomName]) {
		socket.join(roomName);
	}
}

function subscribeUser(uid, subscribeName) {
	//TODO
}

function unsubscribe(socket, subscribeName) {
	//TODO
	logger.warn('unsubscribe in dev');
}

module.exports.SUBSCRIBE_COMPANY_TOUR_PATTERN_LIST = SUBSCRIBE_COMPANY_TOUR_PATTERN_LIST;

module.exports.subscribe = subscribe;
module.exports.unsubscribe = unsubscribe;
