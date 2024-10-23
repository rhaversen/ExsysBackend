/* eslint-disable local/enforce-comment-order */

// Node.js built-in modules

// Third-party libraries
import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import type MongoStore from 'connect-mongo'

// Own modules
import logger from '../app/utils/logger.js'
import config from '../app/utils/setupConfig.js'

const { mongooseOpts } = config
let replSet: MongoMemoryReplSet

export default async function connectToInMemoryMongoDB (): Promise<void> {
	logger.info('Attempting connection to in-memory MongoDB')

	try {
		replSet = new MongoMemoryReplSet()

		await replSet.start()
		await replSet.waitUntilRunning()
		const mongoUri = replSet.getUri()
		await mongoose.connect(mongoUri, mongooseOpts)
		logger.info('Connected to in-memory MongoDB')
	} catch (error: any) {
		logger.error(`Error connecting to in-memory MongoDB: ${error.message !== undefined ? error.message : error}`)
		process.exit(1)
	}
}

function closeSessionStore (sessionStore: MongoStore): void {
	// Clear the interval timer used by connect-mongo
	const cleanupTimer = (sessionStore as any)._removeExpiredSessions
	if (typeof cleanupTimer === 'function') {
		clearInterval(cleanupTimer as NodeJS.Timeout)
	}
}

export async function disconnectFromInMemoryMongoDB (sessionStore: MongoStore): Promise<void> {
	try {
		logger.info('Closing session store...')
		closeSessionStore(sessionStore)
		logger.info('Session store closed')

		logger.info('Closing connection to in-memory MongoDB...')
		await mongoose.disconnect()
		logger.info('Mongoose disconnected')

		logger.info('Stopping memory database replica set...')
		await replSet.stop()
		logger.info('Memory database replica set stopped')
	} catch (error: any) {
		logger.error(`Error disconnecting from in-memory MongoDB: ${error.message !== undefined ? error.message : error}`)
	}
}
