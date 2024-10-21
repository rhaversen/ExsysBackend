// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import sinon from 'sinon'
import chaiHttp from 'chai-http'
import * as chai from 'chai'
import mongoose from 'mongoose'
import { type Server } from 'http'
import { before, beforeEach, afterEach, after } from 'mocha'
import type MongoStore from 'connect-mongo'

// Own modules
import logger from '../app/utils/logger.js'
import { disconnectFromInMemoryMongoDB } from './mongoMemoryReplSetConnector.js'

// Test environment settings
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'TEST_SESSION_SECRET'

// Global variables
const chaiHttpObject = chai.use(chaiHttp)
let app: { server: Server, sessionStore: MongoStore }
let chaiAppServer: ChaiHttp.Agent

const cleanDatabase = async function (): Promise<void> {
	/// ////////////////////////////////////////////
	/// ///////////////////////////////////////////
	if (process.env.NODE_ENV !== 'test') {
		logger.warn('Database wipe attempted in non-test environment! Shutting down.')
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
})

beforeEach(async function () {
	chaiAppServer = chaiHttpObject.request(app.server).keepOpen()
})

afterEach(async function () {
	sinon.restore()
	await cleanDatabase()
	chaiAppServer.close()
})

after(async function () {
	this.timeout(20000)
	// Close the server
	app.server.close()
	// Disconnect from the database
	await disconnectFromInMemoryMongoDB(app.sessionStore)
})

export { chaiAppServer }
