const nconf = require('nconf');
const path = require('path');
const fs = require('fs-extra');

const configFiles = fs.readdirSync(__dirname).filter((file) => {
	if (path.extname(file) !== '.js' || path.basename(file) === 'index.js') {
		return false;
	}

	return true;
});

for (let filename of configFiles) {
	const configName = path.basename(filename, '.js');
	const filepath = path.resolve(__dirname, filename);
	
	nconf.add(configName, { type: 'literal', 
		store: require(filepath)
	});
}

module.exports = nconf;
