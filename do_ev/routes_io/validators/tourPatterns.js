const config = require('config');
const validators = require('./index');
const tourOptions = config.get('tour');
const orderOptions = config.get('order');

function payloadRule(data, validator, prefix = 'data', options = {}) {
	if (validator.isObject(`${prefix}`, data)) {

		//validate name
		validator.isString(`${prefix}.name`, data.name);

		//validate routes
		if (validator.isArray(`${prefix}.routes`, data.routes)) {
			for (const idx in data.routes) {
				const route = data.routes[idx];

				validator.isObject(`${prefix}.routes[${idx}]`, route) 
				&& validator.isObjectId(`${prefix}.routes[${idx}].place`, route.place);

				if (options.patternType === 'order') {
					if (idx === 0) {
						validator.isDateTime(`${prefix}.routes[${idx}].dep`, route.dep);
					} else if (idx === 1) {
						validator.isDateTime(`${prefix}.routes[${idx}].arr`, route.arr);
					}
				}
			}
		}

		//validate desc
		if (validator.isObject(`${prefix}.desc`, data.desc)) {

			//required
			validator.isString(`${prefix}.desc.description`, data.desc.description);

			//not required
			if (data.desc.location) {
				validator.isString(`${prefix}.desc.location`, data.desc.location);
			}

			if (data.desc.infrastructure) {
				validator.isString(`${prefix}.desc.infrastructure`, data.desc.infrastructure);
			}

			if (data.desc.food) {
				validator.isString(`${prefix}.desc.food`, data.desc.food);
			}

			if (data.desc.transfer) {
				validator.isString(`${prefix}.desc.transfer`, data.desc.transfer);
			}
		}

		//validate duration
		if (validator.isObject(`${prefix}.duration`, data.duration)) {

			validator.isInt(`${prefix}.duration.val`, data.duration.val)
			&& validator.aboveZero(`${prefix}.duration.val`, data.duration.val);

			validator.isEnum(`${prefix}.duration.period`, data.duration.period, tourOptions.duration_period);
		}

		//validate guides

		if (validator.isArray(`${prefix}.guides`, data.guides)) {

			if (data.guides.length > 1) {
				validator.errors.push({ name: `${prefix}.guides`, message: 'multiple guide in development' });
			} else {
				const guide = data.guides[0];

				validator.isEnum(`${prefix}.guides[0].variation`, guide.variation, tourOptions.guide_variation);

				if (guide.variation !== 'none') {
					validator.isString(`${prefix}.guides[0].lang`, guide.lang);
				}
			}
		}

		//validate residenceFormat
		validator.isEnum(`${prefix}.residenceFormat`, data.residenceFormat, tourOptions.residence_format);

		//validate tourСategories
		validator.isString(`${prefix}.tourСategories`, data.tourСategories);

		//validate lang
		validator.isString(`${prefix}.lang`, data.lang);

		//validate seats
		if (validator.isObject(`${prefix}.seats`, data.seats)) {

			let existPaidSeats = false;
			for (const idx of orderOptions.ticket_categories) {
				const seat = data.seats[idx];

				if (!seat) {
					continue;
				}

				if (!validator.isObject(`${prefix}.seats.${idx}`, seat)) {
					continue;
				}

				if (
					validator.isInt(`${prefix}.seats[${idx}].val`, seat.val)
					&& validator.aboveZero(`${prefix}.seats[${idx}].val`, seat.val)
				) {
					seat.val > 0 ? existPaidSeats = true : null;
				}

				validator.aboveZero(`${prefix}.seats[${idx}].price`, seat.price);
				validator.isEnum(`${prefix}.seats[${idx}].cur`, seat.cur, orderOptions.currency.list);
			}

			if (!existPaidSeats) {
				validator.errors.push({ name: `${prefix}.seats`, message: 'no paid tickets' });
			}
		}
	}

	return validator;
}

function createRule(data, validator, prefix = 'data') {

	if (validator.isObject(`${prefix}`, data)) {

		//validate companyId
		validator.isObjectId(`${prefix}.companyId`, data.companyId);

		//validate patternType
		validator.isEnum(`${prefix}.patternType`, data.patternType, ['basePattern', 'order']);

		//validate payload
		validator = payloadRule(data.payload, validator, 'data.payload', { patternType: 'order' });
	}

	return validator;
}

module.exports.createRule = createRule;
module.exports.payloadRule = payloadRule;
