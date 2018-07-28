const logger = require('logger').logger;
const path = require('path');
const io = require('ws_server').io;
const toursLib = require('libs/tours');

const prefix = path.basename(__filename, '.js');

const validators = require('./validators'); //TODO: move to validator
const validatorRules = require(`./validators/${prefix}`);

const deepTrim = require('deep-trim');

const find = toursLib.tour.find;


const getEventPath = require('ws_server').routeAndEmitFunct.getEventPathCreator(prefix);

io.on('connection', (socket) => {
	// /api/tourPatterns/createDraftTourPattern

	//MANAGER API
	//todo: checkAUTH

	const getUid = socket => socket.handshake.session.passport.user;

	socket.on(getEventPath('find'), (data, cb) => {

		data = deepTrim(data);
		const validator = new validators();
		validator.applyRule(validatorRules.findRule, data);

		if (validator.errors.length > 0) {
			cb({ status: 'error', message: 'bad params', errors: validator.errors });
			return;
		}

		Promise.resolve()
			.then(() => {
				return find(data);
			})
			.then(result => {

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
});
