// Node.js built-in modules

// Third-party libraries
import express from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import helmet from 'helmet'
import mongoose from 'mongoose'
import RateLimit from 'express-rate-limit'

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
logger.info(`Node environment: ${process.env.NODE_ENV}`)

// Configs
const {
	veryLowSensitivityApiLimiterConfig,
	mediumSensitivityApiLimiterConfig,
	expressPort
} = config

// Global variables and setup
const app = express()

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

	shutDown(1).catch(error => {
		// If 'error' is an Error object, log its stack trace; otherwise, convert to string
		const errorDetail = error instanceof Error ? error.stack ?? error.message : String(error)
		logger.error(`An error occurred during shutdown: ${errorDetail}`)
		process.exit(1)
	})
})

// Handle uncaught exceptions outside middleware
process.on('uncaughtException', (err): void => {
	logger.error('Uncaught exception:', err)
	shutDown(1).catch(error => {
		logger.error('An error occurred during shutdown:', error)
		process.exit(1)
	})
})

// Assigning shutdown function to SIGINT signal
process.on('SIGINT', (): void => {
	logger.info('Received SIGINT')
	shutDown().catch(error => {
		logger.error('An error occurred during shutdown:', error)
		process.exit(1)
	})
})

// Assigning shutdown function to SIGTERM signal
process.on('SIGTERM', (): void => {
	logger.info('Received SIGTERM')
	shutDown().catch(error => {
		logger.error('An error occurred during shutdown:', error)
		process.exit(1)
	})
})

// Shutdown function
export async function shutDown (exitCode?: number | undefined): Promise<void> {
	try {
		logger.info('Closing server...')
		server.close()
		logger.info('Server closed')
		logger.info('Starting database disconnection...')
		await mongoose.disconnect()
		logger.info('Database disconnected')
		logger.info('Shutdown completed')
		process.exit(exitCode ?? 0)
	} catch (error) {
		logger.error('An error occurred during shutdown:', error)
		process.exit(1) // Exit with code 1 indicating termination with error
	}
}

export default app
