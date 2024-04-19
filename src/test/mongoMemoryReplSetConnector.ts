// Node.js built-in modules

// Third-party libraries
import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

// Own modules
import logger from '../app/utils/logger.js'
import config from '../app/utils/setupConfig.js'
import { shutDown } from '../app/index.js'

const { mongooseOpts } = config

export default async function connectToMongoDB (): Promise<void> {
    logger.info('Attempting connection to in-memory MongoDB')

    try {
        const replSet = new MongoMemoryReplSet({
            replSet: { storageEngine: 'wiredTiger' }
        })

        await replSet.start()
        await replSet.waitUntilRunning()
        const mongoUri = replSet.getUri()
        await mongoose.connect(mongoUri, mongooseOpts)
        logger.info('Connected to in-memory MongoDB')
    } catch (error: any) {
        logger.error(`Error connecting to in-memory MongoDB: ${error.message !== undefined ? error.message : error}`)
        await shutDown(1)
    }
}
