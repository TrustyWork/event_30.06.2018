const logger = require('logger').logger;
const io = require('ws_server').io;
const geoLib = require('libs/geo');
const validators = require('./validators');

const path = 'geo';

io.on('connection', (socket) => {

	socket.on(`/api/${path}/google/placesAutoComplete`, (data, cb) => {
		const validator = new validators();

		if (validator.isObject('data', data)) {
			validator.isObject('data.query', data.query);
		}

		if (validator.errors.length > 0) {
			cb({ status: 'error', message: 'bad params', errors: validator.errors });
			return;
		}

		logger.debug(`WS ${socket.id} geo search: `, data.query);

		geoLib.placesAutoComplete(data.query).then((results) => {
			logger.debug(`WS ${socket.id} callback ${results.length} results for geo search: `, data.query);
			cb({ status: 'ok', results });
		}).catch((err) => {
			logger.warn( `WS ${socket.id} geo search fail: `, data.query, 'err:', err);
			cb({ status: 'err', message: '500' });
		});
	});


	socket.on(`/api/${path}/google/place`, (data, cb) => {

		const validator = new validators();

		if (validator.isObject('data', data)) {
			validator.isObject('data.query', data.query);
			validator.isString('data.query.placeid', data.query.placeid);
		}

		if (validator.errors.length > 0) {
			cb({ status: 'error', message: 'bad params', errors: validator.errors });
			return;
		}

		logger.debug(`WS ${socket.id} request geo plaseId: ${data.query.placeId}`);
		geoLib.place(data.query).then((result) => {
			logger.debug(`WS ${socket.id} callback result for request geo placeId: `, data.query.placeId);
			cb({ status: 'ok', result });
		}).catch((err) => {
			logger.warn( `WS ${socket.id} request geo placeId fail: `, data.query.placeId, 'err:', err);
			cb({ status: 'err', message: '500' });
		});
	});
});
