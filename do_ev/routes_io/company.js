const logger = require('logger').logger;
const path = require('path');

const io = require('ws_server').io;
const companySubscribe = require('subscribe_io/company');
const companyLib = require('libs/company');

//company functions
const getCompaniesIdAndName = companyLib.getCompaniesIdAndName;
const getCompany = companyLib.getCompany;
const createCompany = companyLib.createCompany;
const updateCompany = companyLib.updateCompany;
const deleteCompany = companyLib.deleteCompany;

//subscribe functions
const SUBSCRIBE_COMPANY_LIST = companySubscribe.SUBSCRIBE_COMPANY_LIST;


const prefix = path.basename(__filename, '.js');
const getEventPath = require('ws_server').routeAndEmitFunct.getEventPathCreator(prefix);

io.on('connection', (socket) => {

	//SUPERADMIN API
	//todo: checkAUTH
	socket.on(getEventPath('getCompanyList'), (data, cb) => {

		return getCompaniesIdAndName()
			.then(companies => {
				cb({ status: 'ok', results: companies });
				logger.debug(`Send company list, size ${Object.keys(companies).length}`);

				if (data.subscribe === true) {
					companySubscribe.subscribe(socket, SUBSCRIBE_COMPANY_LIST);
				}
			})
			.catch(err => {
				logger.error(err);
				cb({ status: 'error', message: '500' });
			});
	});

	socket.on(getEventPath('getCompany'), (data, cb) => {
		if (!data.id) {
			cb({ status: 'error', message: 'bad params' });
			return;
		}

		return getCompany(data.id)
			.then(company => {
				if (!company) {
					company = company.toObject();	
					cb({ status: 'not_found', result: null });
					logger.debug(`Send not found company ${data.id}`);
					return;
				}

				company = company.toObject();
				cb({ status: 'ok', result: company });
				logger.debug(`Send company ${data.id}`);
			})
			.catch(err => {
				logger.error(err);
				cb({ status: 'error', message: '500' });
			});
	});

	socket.on(getEventPath('createCompany'), (data, cb) => {

		if (!data.payload.name || !data.payload.firstStaff) {
			cb({ status: 'error', message: 'bad params' });
			return;
		}

		return createCompany(data.payload)
			.then(response => {
				if (response.status === 'error' && response.message === 'not_found_uid') {
					cb({ status: 'error', message: 'not_found_uid' });
					logger.debug('Send cb after fail create company, error not_found_uid');
					return;
				}

				cb({ status: 'ok', id: response.id });
				logger.debug(`Send cb after create company ${response.id}`);
			})
			.catch(err => {
				logger.error(err);
			});
	});

	socket.on(getEventPath('updateCompany'), (data, cb) => {
		logger.debug('Update company Requested');
		return updateCompany(data.id, data.update)
			.then(data => cb({ status: 'ok', data: data.company }))
			.catch(err => {
				logger.error(err);
				cb({ status: 'error', message: '500' });
			});
	});

	socket.on(getEventPath('deleteCompany'), (data, cb) => {
		logger.debug('Update company Requested');
		return deleteCompany(data.id)
			.then(result => cb({ err: null, data: result }))
			.catch(err => {
				logger.error(err);
				cb({ status: 'error', message: '500' });
			});
	});

});

io.on('connection', (socket) => {

	// MANAGER API

	// Go away, anonymous!
	//if (!uid)  return;

	logger.debug('managerAPI mounted');

	socket.on(getEventPath('getMyCompanies'), (_data, cb) => {

		let uid = null;

		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			uid = socket.handshake.session.passport.user;
		}
		logger.debug(uid);
		logger.debug('GetMyCompanies Requested');
		return companyLib.getCompaniesByManager(uid)
			.then(result => cb({ err: null, data: result }))
			.catch(err => {
				logger.error(err);
				cb({ status: 'error', message: '500' })
			});
	});

	socket.on(getEventPath('updateUserRoles'), (data, cb) => {

		//IMPLEMENT SECURITY CHECK!!!!
		let uid = null;
		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			uid = socket.handshake.session.passport.user;
		}

		const company = data.company;
		const user = data.user;
		const roles = data.roles;

		logger.debug('updateUserRoles Requested');

		if (!uid || !company || !user || !roles) { return cb({ err: 'Not full data', data: null }); }

		return companyLib.updateUserRoles(company, user, roles)
			.then(result => cb({ err: null, data: result }))
			.catch(err => {
				logger.error(err);
				cb({ status: 'error', message: '500' })
			});
	});

	socket.on(getEventPath('addPersonel'), (data, cb) => {

		//IMPLEMENT SECURITY CHECK!!!!
		let uid = null;
		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			uid = socket.handshake.session.passport.user;
		}

		const company = data.company;
		const user = data.user;
		const roles = data.roles;

		logger.debug('addPersonel Requested');

		if (!uid || !company || !user || !roles) { return cb({ err: 'Not full data', data: null }); }

		return companyLib.addPersonel(company, user, roles)
			.then(result => cb({ err: null, data: result }))
			.catch(err => {
				logger.error(err);
				cb({ status: 'error', message: '500' })
			});
	});

	socket.on(getEventPath('delPersonel'), (data, cb) => {

		//IMPLEMENT SECURITY CHECK!!!!
		let uid = null;
		if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
			uid = socket.handshake.session.passport.user;
		}

		const company = data.company;
		const user = data.user;

		logger.debug('delPersonel Requested');

		if (!uid || !company || !user) { return cb({ err: 'Not full data', data: null }); }

		return companyLib.delPersonel(company, user)
			.then(result => cb({ err: null, data: result }))
			.catch(err => {
				logger.error(err);
				cb({ status: 'error', message: '500' })
			});
	});

});