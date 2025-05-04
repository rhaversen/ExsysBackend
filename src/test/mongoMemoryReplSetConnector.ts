import type MongoStore from 'connect-mongo'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import mongoose from 'mongoose'

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
	} catch (error) {
		if (error instanceof Error) {
			logger.error(`Error connecting to in-memory MongoDB: ${error.message}`)
		} else {
			logger.error(`Error connecting to in-memory MongoDB: ${String(error)}`)
		}
		throw error // Re-throw the error for higher-level handling
	}
}

export async function disconnectFromInMemoryMongoDB (sessionStore: MongoStore): Promise<void> {
	try {
		logger.info('Closing session store...')
		await sessionStore.close()
		logger.info('Session store closed')

		logger.info('Closing connection to in-memory MongoDB...')
		await mongoose.disconnect()
		logger.info('Mongoose disconnected')

		logger.info('Stopping memory database replica set...')
		await replSet.stop({ doCleanup: true, force: true })
		logger.info('Memory database replica set stopped')
	} catch (error) {
		if (error instanceof Error) {
			logger.error(`Error disconnecting from in-memory MongoDB: ${error.message}`)
		} else {
			logger.error(`Error disconnecting from in-memory MongoDB: ${String(error)}`)
		}
		throw error // Re-throw the error for higher-level handling
	}
}
