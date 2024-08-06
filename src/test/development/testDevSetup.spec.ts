// Global variables
let gracefulShutdownFunction: () => Promise<void>

before(async function () {
	this.timeout(10000)
	// Setting environment
	process.env.NODE_ENV = 'development'

	// Importing and starting the app
	await import('../../development/index.js')
})

after(async function () {
	this.timeout(10000)
	await gracefulShutdownFunction()

	// exit the process after 3 seconds
	setTimeout(() => process.exit(0), 3000)
})
