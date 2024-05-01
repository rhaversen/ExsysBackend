// Node.js built-in modules

// Third-party libraries
import express from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import helmet from 'helmet'
import mongoose from 'mongoose'
import RateLimit from 'express-rate-limit'
import cors from 'cors'
import gracefulShutdown from 'http-graceful-shutdown'

// Own Modules
import databaseConnector from './utils/databaseConnector.js'
import logger from './utils/logger.js'
import config from './utils/setupConfig.js'
import globalErrorHandler from './middleware/globalErrorHandler.js'

// Routes
import serviceRoutes from './routes/service.js'
import orderRoutes from './routes/orders.js'
import productRoutes from './routes/products.js'
import adminRoutes from './routes/admins.js'
import roomRoutes from './routes/rooms.js'
import optionRoutes from './routes/options.js'

// Logging environment
if (typeof process.env.NODE_ENV !== 'undefined') {
	logger.info(`Node environment: ${process.env.NODE_ENV}`)
} else {
	logger.warn('Node environment is undefined. Shutting down...')
	process.exit(1)
}

// Configs
const {
	veryLowSensitivityApiLimiterConfig,
	mediumSensitivityApiLimiterConfig,
	expressPort,
	corsConfig
} = config

// Global variables and setup
const app = express()
app.use(cors(corsConfig))

// Connect to MongoDB in production and staging environment
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
	await databaseConnector.connectToMongoDB()
}

// Middleware
app.use(helmet())
app.use(express.json())
app.use(mongoSanitize())

// Rate limiters
const veryLowSensitivityApiLimiter = RateLimit(veryLowSensitivityApiLimiterConfig)
const mediumSensitivityApiLimiter = RateLimit(mediumSensitivityApiLimiterConfig)

// Use all routes with medium sensitivity rate limiter
app.use('/v1/orders', mediumSensitivityApiLimiter, orderRoutes)
app.use('/v1/products', mediumSensitivityApiLimiter, productRoutes)
app.use('/v1/admins', mediumSensitivityApiLimiter, adminRoutes)
app.use('/v1/rooms', mediumSensitivityApiLimiter, roomRoutes)
app.use('/v1/options', mediumSensitivityApiLimiter, optionRoutes)
app.use('/service', mediumSensitivityApiLimiter, serviceRoutes)

// Apply low sensitivity for service routes
app.use('/service', veryLowSensitivityApiLimiter)

// Apply medium sensitivity for all database operation routes
app.use('/v1/orders', mediumSensitivityApiLimiter)
app.use('/v1/products', mediumSensitivityApiLimiter)
app.use('/v1/admins', mediumSensitivityApiLimiter)
app.use('/v1/rooms', mediumSensitivityApiLimiter)
app.use('/v1/options', mediumSensitivityApiLimiter)

// Apply stricter rate limiters to routes
// none

// Global error handler middleware
app.use(globalErrorHandler)

// Listen
export const server = app.listen(expressPort, () => {
	logger.info(`Express is listening at http://localhost:${expressPort}`)
})

// Handle unhandled rejections outside middleware
process.on('unhandledRejection', (reason, promise): void => {
	// Attempt to get a string representation of the promise
	const promiseString = JSON.stringify(promise) !== '' ? JSON.stringify(promise) : 'a promise'

	// Get a detailed string representation of the reason
	const reasonDetail = reason instanceof Error ? reason.stack ?? reason.message : JSON.stringify(reason)

	// Log the detailed error message
	logger.error(`Unhandled Rejection at: ${promiseString}, reason: ${reasonDetail}`)

	shutDown().catch(error => {
		// If 'error' is an Error object, log its stack trace; otherwise, convert to string
		const errorDetail = error instanceof Error ? error.stack ?? error.message : String(error)
		logger.error(`An error occurred during shutdown: ${errorDetail}`)
		process.exit(1)
	})
})

// Handle uncaught exceptions outside middleware
process.on('uncaughtException', (err): void => {
	logger.error('Uncaught exception:', err)
	shutDown().catch(error => {
		logger.error('An error occurred during shutdown:', error)
		process.exit(1)
	})
})

// Shutdown function
export async function shutDown (): Promise<void> {
	logger.info('Closing server...')
	server.close()
	logger.info('Server closed')
	logger.info('Closing database connection...')
	await mongoose.connection.close()
	logger.info('Database connection closed')

	if (databaseConnector.isMemoryDatabase()) {
		const mongoMemoryReplSetConnector = await import('../test/mongoMemoryReplSetConnector.js')
		await mongoMemoryReplSetConnector.disconnectFromInMemoryMongoDB()
	}

	logger.info('Shutdown completed')
}

gracefulShutdown(server,
	{
		signals: 'SIGINT SIGTERM',
		timeout: 10000,							// Timeout in ms
		forceExit: true,						// Trigger process.exit() at the end of shutdown process
		development: false,						// Terminate the server, ignoring open connections, shutdown function, finally function
		// preShutdown: preShutdownFunction,	// Operation before httpConnections are shut down
		onShutdown: shutDown					// Shutdown function (async) - e.g. for cleanup DB, ...
		// finally: finalFunction				// Finally function (sync) - e.g. for logging
	}
)

export default app
