module.exports = {
	logger: {
		console: {
			colorize: true,
			json: false,
			prettyPrint: true
		},
		nativeConsole: process.env.nativeConsole || false
	}
}