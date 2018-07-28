const logger = require('logger').logger;
const path = require('path');
const io = require('ws_server').io;
const tourPatternsSubscribe = require('subscribe_io/tourPatterns');
const toursLib = require('libs/tours');
const ss = require('socket.io-stream');
const filesLib = require('libs/files');

const prefix = path.basename(__filename, '.js');

const validators = require('./validators'); //TODO: move to validator
const validatorRules = require(`./validators/${prefix}`);

const deepTrim = require('deep-trim');

const config = require('config');
const orderOptions = config.get('order');

const createTourPattern = toursLib.tourPatterns.create;
const findTourPatternByCompany = toursLib.tourPatterns.getByCompany;
const makeCuteTourPatterns = toursLib.tourPatterns.makeCute;
const putTourPatternImage = toursLib.tourPatterns.putImage;
const existUserInTourPattern = toursLib.tourPatterns.existUserIn;
const removeTourPattern = toursLib.tourPatterns.remove;
const existUserInCompany = require('libs/company').existUserInCompany;


//subscribe functions
const SUBSCRIBE_COMPANY_TOUR_PATTERN_LIST = tourPatternsSubscribe.SUBSCRIBE_COMPANY_TOUR_PATTERN_LIST;

const getEventPath = require('ws_server').routeAndEmitFunct.getEventPathCreator(prefix);

io.on('connection', (socket) => {
	// /api/tourPatterns/createDraftTourPattern

	//MANAGER API
	//todo: checkAUTH

	const getUid = socket => socket.handshake.session.passport.user;

	socket.on(getEventPath('getListByCompany'), (data, cb) => {
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

				return findTourPatternByCompany(companyId);
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

				cb({ status: 'ok', results: result.results });
				logger.debug(`Send tour pattern list, size ${Object.keys(result.results).length}`);

				if (data.subscribe === true) {
					tourPatternsSubscribe.subscribe(socket, SUBSCRIBE_COMPANY_TOUR_PATTERN_LIST, { companyId });
				}
			})
			.catch(err => {
				logger.error(err);
				cb({ status: 'error', message: '500' });
			});
	});


	socket.on(getEventPath('create'), (data, cb) => {

		//validate
		data = deepTrim(data);
		const validator = new validators();
		validator.applyRule(validatorRules.createRule, data);

		if (validator.errors.length > 0) {
			logger.debug('validation erorrs:', validator.errors);
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

				//seats
				const seats = {};
				for (const idx of orderOptions.ticket_categories) {
					const seat = data.payload.seats[idx];

					if (!seat) {
						continue;
					}

					seats[idx] = seat;
				}

				//guides
				const guides = [ data.payload.guides[0] ];

				const payload = {
					name: data.payload.name
					, routes: data.payload.routes
					, desc: data.payload.desc
					, duration: data.payload.duration
					, guides
					, residenceFormat: data.payload.residenceFormat
					, tourСategories: data.payload.tourСategories
					, lang: data.payload.lang
					, seats
					, patternType: data.patternType
					, company: companyId
				};

				return createTourPattern(payload);
			})
			.then(res => {
				cb({ status: 'ok', id: res.id });
			})
			.catch(err => {
				if (err === 'nonexistent company id') {
					cb({ status: 'error', message: 'nonexistent company id' });
					return;
				}

				logger.error(err);
				cb({ status: 'error', message: '500' });
			});
	});

	ss(socket).on(getEventPath('putImage'), (stream, data, cb) => {
		if (
			data.file === undefined ||
			data.file.name === undefined ||
			data.file.type === undefined ||
			data.tourPatternId === undefined
		) {
			cb({ status: 'error', message: 'bad params' });
			return;
		}

		const tourPatternId = data.tourPatternId; //TODO: check exist
		let imageId = null;
		let imageUrl = null;

		filesLib.uploadStream(stream, data.file)
			.then(fileInfo => {
				imageId = fileInfo.id;
				imageUrl = fileInfo.fileurl;

				return putTourPatternImage(imageId, tourPatternId);
			})
			.then(() => {
				cb({ status: 'ok', id: imageId, url: imageUrl });
			})
			.catch(err => {
				cb({ status: 'error', message: '500' });
			});
	});

	socket.on(getEventPath('remove'), (data, cb) => {

		data = deepTrim(data);

		//validate
		const validator = new validators();

		if (validator.isObject('data', data)) {
			validator.isObjectId('data.id', data.id);
		}

		if (validator.errors.length > 0) {
			cb({ status: 'error', message: 'bad params', errors: validator.errors });
			return;
		}

		const uid = getUid(socket);
		const tourPatternId = data.id;

		Promise.resolve()
			.then(() => {
				return existUserInTourPattern(uid, tourPatternId);
			})
			.then(isExistUserInTourPattern => {
				if (!isExistUserInTourPattern) {
					throw 'access denied';
				}

				return removeTourPattern(tourPatternId);
			})
			.then(() => {
				cb({ status: 'ok' });
				logger.debug(`Send cb after remove tour pattern, id ${tourPatternId}`);
			})
			.catch(err => {
				if (err === 'access denied') {
					cb({ status: 'error', message: 'access denied' });
					logger.warn(`Fail remove tour pattern id ${tourPatternId}, access denied`);
					return;
				}

				logger.error(err);
				cb({ status: 'error', message: '500' });
			});
	});
});
