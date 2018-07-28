function findRule(data, validator, prefix = 'data') {

	if (!validator.isObject(`${prefix}`, data)) {
		return validator;
	}

	if (!validator.isObject(`${prefix}.query`, data.query)) {
		return validator;
	}

	if (validator.isObject(`${prefix}.query.arr`, data.query.arr)) {
		data.query.arr.id ? validator.isSrting(`${prefix}.query.arr.id`, data.query.arr.id) : null;
		validator.isString(`${prefix}.query.arr.val`, data.query.arr.val);
	}

	if (validator.isObject(`${prefix}.query.dep`, data.query.dep)) {
		data.query.arr.id ? validator.isSrting(`${prefix}.query.dep.id`, data.query.dep.id) : null;
		validator.isSrting(`${prefix}.query.dep.val`, data.query.dep.val);
	}

	if (validator.isObject(`${prefix}.query.date`, data.query.date)) {
		validator.isSrting(`${prefix}.query.date.dep`, data.query.date.dep);
		validator.isSrting(`${prefix}.query.date.arr`, data.query.date.arr);
	}


	return validator;
}

module.exports.findRule = findRule;
