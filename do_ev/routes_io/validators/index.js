const moment = require('moment');
const isObjectId = require('mongoose').Types.ObjectId.isValid;

module.exports = function(errPrefix = false) {
	this.errors = [];

	if (errPrefix) {
		errPrefix = `${errPrefix}.`;
	}

	this.isRequired = (path, val) => {
		if (val === undefined) {
			this.errors.push({ name: path, message: 'undefined' });
			return false;
		}
		return true;
	};

	this.isString = (path, val) => {
		if (!this.isRequired(path, val)) {
			return false;
		}

		if (typeof val !== 'string') {
			this.errors.push({ name: path, message: 'not a string' });
		} else if (val.length === 0) {
			this.errors.push({ name: path, message: 'empty string' });
		} else {
			return true;
		}

		return false;
	};

	this.isEnum = (path, val, allowVals) => {
		if (!this.isRequired(path, val)) {
			return false;
		}

		if (!this.isArray(`${path} list of allows`, allowVals)) {
			return false;
		}

		if (allowVals.indexOf(val) === -1) {
			this.errors.push({ name: path, message: 'invalid value' });
		} else {
			return true;
		}

		return false;

	};

	this.isObjectId = (path, val) => {
		if (this.isString(path, val) && !isObjectId(val)) {
			this.errors.push({ name: path, message: 'not a objectId' });
		} else {
			return true;
		}

		return false;
	};

	this.isObject = (path, val) => {
		if (!this.isRequired(path, val)) {
			return false;
		}

		if (val !== Object(val)) {
			this.errors.push({ name: path, message: 'not a object' });
		} else {
			return true;
		}

		return false;
	};

	this.isArray = (path, val) => {
		if (!this.isRequired(path, val)) {
			return false;
		}

		if (!Array.isArray(val)) {
			this.errors.push({ name: path, message: 'not a array' });
		} else if (val.length === 0) {
			this.errors.push({ name: path, message: 'empty array' });
		} else {
			return true;
		}

		return false;
	};

	this.isNumber = (path, val) => {
		if (!this.isRequired(path, val)) {
			return false;
		}

		if (typeof val !== 'number') {
			this.errors.push({ name: path, message: 'not a number' });
		} else  {
			return true;
		}

		return false;
	};

	this.isBoolean = (path, val) => {
		if (!this.isRequired(path, val)) {
			return false;
		}

		if (typeof val !== 'boolean') {
			this.errors.push({ name: path, message: 'not a boolean' });
		} else  {
			return true;
		}

		return false;
	};

	this.isInt = (path, val) => {
		if (!this.isNumber(path, val)) {
			return false;
		}

		if (!Number.isInteger(val)) {
			this.errors.push({ name: path, message: 'not a int' });
		} else  {
			return true;
		}

		return false;
	};

	this.aboveZero = (path, val) => {
		if (!this.isNumber(path, val)) {
			return false;
		}

		if (val < 0) {
			this.errors.push({ name: path, message: 'less than zero' });
		} else  {
			return true;
		}

		return false;
	};

	this.isGeo = (path, val) => {
		if (!this.isObject) {
			return false;
		}

		let combineResult = true;
		for (const idx of ['lat', 'lng']) {
			if (!this.isRequired(`${path}.${idx}`, val[idx])) {
				combineResult = false;
			} else if (!this.isNumber(`${path}.${idx}`, val[idx])) {
				combineResult = false;
			}
		}

		return combineResult;
	};

	this.isDateTime = (path, val) => {
		if (!this.isString) {
			return false;
		}


		if (moment.isValid(val)) {
			this.errors.push({ name: path, message: 'invalid datetime format' });
		} else  {
			return true;
		}


		return false;
	};

	this.applyRule = (rule, data) => {
		rule(data, this);
	};
};
