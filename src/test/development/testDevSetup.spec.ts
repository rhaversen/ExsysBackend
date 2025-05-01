before(async function () {
	this.timeout(10000)
	// Setting environment
	process.env.NODE_ENV = 'development'

	// Importing and starting the app
	await import('../../development/index.js')
})
