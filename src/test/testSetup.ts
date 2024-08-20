// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import sinon from 'sinon'
import chaiHttp from 'chai-http'
import * as chai from 'chai'
import mongoose from 'mongoose'
import gracefulShutdown from 'http-graceful-shutdown'
import { type Server } from 'http'

// Own modules
import logger from '../app/utils/logger.js'

// Test environment settings
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'TEST_SESSION_SECRET'
process.env.CSRF_TOKEN = 'TEST_CSRF_TOKEN'

// Global variables
const chaiHttpObject = chai.use(chaiHttp)
let app: { shutDown: () => Promise<void>, server: Server }
let chaiAppServer: ChaiHttp.Agent
let gracefulShutdownFunction: () => Promise<void>

const cleanDatabase = async function (): Promise<void> {
	/// ////////////////////////////////////////////
	/// ///////////////////////////////////////////
	if (process.env.NODE_ENV !== 'test') {
		logger.warn('Database wipe attempted in non-test environment! Shutting down.')
		await gracefulShutdownFunction()
		return
	}
	/// ////////////////////////////////////////////
	/// ///////////////////////////////////////////
	logger.debug('Cleaning databases')
	if (mongoose.connection.db !== undefined) {
		await mongoose.connection.db.dropDatabase()
	}
}

before(async function () {
	this.timeout(20000)
	// Setting environment
	process.env.NODE_ENV = 'test'

	// Connect to the database
	const database = await import('./mongoMemoryReplSetConnector.js')
	await database.default()

	// Importing and starting the app
	app = await import('../app/index.js')

	// Graceful shutdown setup
	gracefulShutdownFunction = gracefulShutdown(app.server,
		{
			signals: 'SIGINT SIGTERM',
			timeout: 20000,							// Timeout in ms
			forceExit: false,						// Trigger process.exit() at the end of shutdown process
			development: false,						// Terminate the server, ignoring open connections, shutdown function, finally function
			// preShutdown: preShutdownFunction,	// Operation before httpConnections are shut down
			onShutdown: app.shutDown				// Shutdown function (async) - e.g. for cleanup DB, ...
			// finally: finalFunction				// Finally function (sync) - e.g. for logging
		}
	)
})

beforeEach(async function () {
	chaiAppServer = chaiHttpObject.request(app.server).keepOpen()
})

afterEach(async function () {
	sinon.restore()
	await cleanDatabase()
})

after(async function () {
	this.timeout(20000)
	await gracefulShutdownFunction()

	// exit the process after 1 second
	setTimeout(() => process.exit(0), 1000)
})

export { chaiAppServer }
