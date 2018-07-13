const path = require('path');

module.exports = {
	httpServer: {
		staticDir: path.resolve(__dirname, '../', 'public'),
		port: process.env.PORT || 4000
	}
}
