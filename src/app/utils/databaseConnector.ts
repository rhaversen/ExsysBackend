// Node.js built-in modules

// Third-party libraries
import mongoose from 'mongoose'

// Own modules
import logger from './logger.js'
import config from './setupConfig.js'
import { shutDown } from '../index.js'

// Constants
const {
	mongooseOpts,
	maxRetryAttempts,
	retryInterval,
	retryWrites,
	w,
	appName
} = config
const mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=${retryWrites}&w=${w}&appName=${appName}`

function isMemoryDatabase (): boolean {
	return mongoose.connection.host.toString() === '127.0.0.1'
}

async function disconnectFromMongoDB (): Promise<void> {
	try {
		await mongoose.disconnect()
		logger.info('Disconnected from MongoDB')
	} catch (error: any) {
		logger.error(`Error disconnecting from MongoDB: ${error.message !== undefined ? error.message : error}`)
	}
}

async function connectToMongoDB (): Promise<void> {
	if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') return

	for (let currentRetryAttempt = 0; currentRetryAttempt < maxRetryAttempts; currentRetryAttempt++) {
		logger.info('Attempting connection to MongoDB')

		try {
			await mongoose.connect(mongoUri, mongooseOpts)
			logger.info('Connected to MongoDB')
			return // Successfully connected
		} catch (error: any) {
			logger.error(`Error connecting to MongoDB: ${error.message !== undefined ? error.message : error}`)
			await new Promise(resolve => setTimeout(resolve, retryInterval))
		}
	}

	// Exhausted retries
	logger.error(`Failed to connect to MongoDB after ${maxRetryAttempts} attempts. Shutting down.`)
	await shutDown()
}

const databaseConnector = {
	isMemoryDatabase,
	disconnectFromMongoDB,
	connectToMongoDB
}

export default databaseConnector
