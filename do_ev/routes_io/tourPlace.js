const logger = require('logger').logger;
const path = require('path');
const io = require('ws_server').io;
const tourPlaceSubscribe = require('subscribe_io/tourPlace');
const toursLib = require('libs/tours');
const validators = require('./validators');
const deepTrim = require('deep-trim');

const createPlace = toursLib.places.create;
const removePlace = toursLib.places.remove;
const getPlacesByCompany = toursLib.places.getByCompany;
const existUserInCompany = require('libs/company').existUserInCompany;
const existUserInPlace = toursLib.places.existUserIn;

//subscribe functions
const SUBSCRIBE_COMPANY_PLACE_LIST = tourPlaceSubscribe.SUBSCRIBE_COMPANY_PLACE_LIST;



const prefix = path.basename(__filename, '.js');

const getEventPath = require('ws_server').routeAndEmitFunct.getEventPathCreator(prefix);

io.on('connection', (socket) => {
	// /api/tourPlace/createPlace

	//MANAGER API
	//todo: checkAUTH

	const getUid = socket => socket.handshake.session.passport.user;

	socket.on(getEventPath('getCompanyPlaceList'), (data, cb) => {
		if (
			!data.companyId
		) {
			cb({ status: 'error', message: 'bad params' });
			return;
		}

		const uid = getUid(socket);
		const companyId = data.companyId;

		Promise.resolve()
			.then(() => {
				return existUserInCompany(uid, companyId);
			})
			.then(isExistUserInCompany => {
				if (!isExistUserInCompany) {
					throw 'nonexistent company id';
				}

				return getPlacesByCompany(companyId);
			})
			.then(result => {
				if (result.status !== 'ok') {
					logger.error(result.message);
					cb({ status: 'error', message: '500' });
					return;
				}

				cb({ status: 'ok', results: result.results });
				logger.debug(`Send place list, size ${Object.keys(result.results).length}`);

				if (data.subscribe === true) {
					tourPlaceSubscribe.subscribe(socket, SUBSCRIBE_COMPANY_PLACE_LIST, { companyId });
				}
			})
			.catch(err => {
				logger.error(err);
				cb({ status: 'error', message: '500' });
			});
	});

	socket.on(getEventPath('create'), (data, cb) => {

		data = deepTrim(data);

		//validate
		const validator = new validators();

		validator.isObjectId('data.companyId', data.companyId);
		if (validator.isObject('data.payload', data.payload)) {
			validator.isString('data.payload.name', data.payload.name);
			validator.isString('data.payload.placeName', data.payload.placeName);
			validator.isGeo('data.payload.position', data.payload.position);
			validator.isString('data.payload.glPlaceId', data.payload.glPlaceId);
			validator.isBoolean('data.payload.isHighlight', data.payload.isHighlight);
		}

		if (validator.errors.length > 0) {
			cb({ status: 'error', message: 'bad params', errors: validator.errors });
			return;
		}

		const uid = getUid(socket);
		const companyId = data.companyId;

		Promise.resolve()
			.then(() => {
				return existUserInCompany(uid, companyId);
			})
			.then(isExistUserInCompany => {
				if (!isExistUserInCompany) {
					throw 'nonexistent company id';
				}

				const payload = {
					name: data.payload.name
					, placeName: data.payload.placeName
					, company: companyId
					, position: data.payload.position
					, glPlaceId: data.payload.glPlaceId
					, isHighlight: data.payload.isHighlight
				};

				return createPlace(payload);
			})
			.then(result => {
				cb({ status: 'ok', id: result.id });
				logger.debug(`Send cb after create place, id ${result.id}`);
			})
			.catch(err => {
				if (err === 'nonexistent company id') {
					logger.warn('Fail create new place, bad company id');
					cb({ status: 'error', message: 'nonexistent company id' });
					return;
				}
				logger.error(err);
				cb({ status: 'error', message: '500' });
			});
	});

	socket.on(getEventPath('remove'), (data, cb) => {

		data = deepTrim(data);

		//validate
		const validator = new validators();

		validator.isObjectId('data.id', data.id);

		if (validator.errors.length > 0) {
			cb({ status: 'error', message: 'bad params', errors: validator.errors });
			return;
		}

		const uid = getUid(socket);
		const placeId = data.id;

		Promise.resolve()
			.then(() => {
				return existUserInPlace(uid, placeId);
			})
			.then(isExistUserInPlace => {
				if (!isExistUserInPlace) {
					throw 'access denied';
				}

				return removePlace(placeId);
			})
			.then(() => {
				cb({ status: 'ok' });
				logger.debug(`Send cb after remove place, id ${placeId}`);
			})
			.catch(err => {
				if (err === 'access denied') {
					cb({ status: 'error', message: 'access denied' });
					logger.warn(`Fail remove place id ${placeId}, access denied`);
					return;
				}

				logger.error(err);
				cb({ status: 'error', message: '500' });
			});
	});
});
