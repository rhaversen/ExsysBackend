// Verify that all environment secrets are set
import './utils/verifyEnvironmentSecrets.js'

// Use Sentry
import './utils/instrument.js'

// Node.js built-in modules
import { createServer } from 'node:http'

// Third-party libraries
import express from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import helmet from 'helmet'
import mongoose from 'mongoose'
import RateLimit from 'express-rate-limit'
import cors from 'cors'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import MongoStore from 'connect-mongo'
import * as Sentry from '@sentry/node'

// Own Modules
import databaseConnector from './utils/databaseConnector.js'
import logger from './utils/logger.js'
import config from './utils/setupConfig.js'
import globalErrorHandler from './middleware/globalErrorHandler.js'
import configurePassport from './utils/passportConfig.js'
import { initSocket } from './utils/socket.js'
import { type ISession } from './models/Session.js'
import { transformSession } from './utils/sessionUtils.js'
import { emitSessionUpdated } from './webSockets/sessionHandlers.js'

// Business logic routes
import orderRoutes from './routes/orders.js'
import productRoutes from './routes/products.js'
import adminRoutes from './routes/admins.js'
import roomRoutes from './routes/rooms.js'
import optionRoutes from './routes/options.js'
import authRoutes from './routes/auth.js'
import activityRoutes from './routes/activities.js'
import kioskRoutes from './routes/kiosks.js'
import readerRoutes from './routes/readers.js'
import sessionRoutes from './routes/sessions.js'

// Callback routes
import readerCallbackRoutes from './routes/readerCallback.js'

// Service routes
import serviceRoutes from './routes/service.js'

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
	corsConfig,
	webhookCorsConfig,
	cookieOptions
} = config

// Global variables and setup
const app = express() // Create an Express application
const server = createServer(app) // Create an HTTP server
await initSocket(server) // Initialize socket.io
app.set('trust proxy', 1) // Trust the first proxy (NGINX)

// Connect to MongoDB in production and staging environment
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
	await databaseConnector.connectToMongoDB()
}

// Middleware
app.use(helmet()) // Security headers
app.use(express.json()) // for parsing application/json
app.use(cookieParser()) // For parsing cookies
app.use(mongoSanitize()) // Data sanitization against NoSQL query injection

// Apply webhook cors config to webhook routes
app.use('/api/v1/reader-callback', cors(webhookCorsConfig))
app.use('/api/v1/reader-callback', readerCallbackRoutes)

// Apply cors config to all other routes
app.use(cors(corsConfig))

// Session management
app.use(session({ // Session management
	resave: true, // Save the updated session back to the store
	rolling: true, // Reset the cookie max-age on every request
	secret: process.env.SESSION_SECRET ?? '', // Secret for signing session ID cookie
	saveUninitialized: false, // Do not save session if not authenticated
	store: MongoStore.create({ // Store session in MongoDB
		client: mongoose.connection.getClient(), // Use the existing connection
		autoRemove: 'interval', // Remove expired sessions
		autoRemoveInterval: 1 // 1 minute
	}),
	cookie: cookieOptions
}))
app.use(passport.initialize()) // Initialize Passport
app.use(passport.session()) // Passport session handling
configurePassport(passport) // Use passportConfig

// Rate limiters
const veryLowSensitivityApiLimiter = RateLimit(veryLowSensitivityApiLimiterConfig)
const mediumSensitivityApiLimiter = RateLimit(mediumSensitivityApiLimiterConfig)

// Middleware to update last activity on each request
app.use((req, res, next) => {
	if (req.isAuthenticated() && req.session !== undefined) {
		req.session.lastActivity = new Date()

		const sessionDoc: ISession = {
			_id: req.sessionID,
			session: JSON.stringify(req.session),
			expires: req.session.cookie.expires ?? null
		}

		const transformedSession = transformSession(sessionDoc)

		emitSessionUpdated(transformedSession)
	}
	next()
})

// Use all routes
app.use('/api/v1/orders', orderRoutes)
app.use('/api/v1/products', productRoutes)
app.use('/api/v1/admins', adminRoutes)
app.use('/api/v1/rooms', roomRoutes)
app.use('/api/v1/options', optionRoutes)
app.use('/api/service', serviceRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/activities', activityRoutes)
app.use('/api/v1/kiosks', kioskRoutes)
app.use('/api/v1/readers', readerRoutes)
app.use('/api/v1/sessions', sessionRoutes)
app.use('/api/v1/reader-callback', mediumSensitivityApiLimiter)

// Apply low sensitivity for service routes
app.use('/service', veryLowSensitivityApiLimiter)

// Apply medium sensitivity for callback routes
app.use('/api/v1/reader-callback', mediumSensitivityApiLimiter)

// Apply medium sensitivity for all other routes
app.use(mediumSensitivityApiLimiter)

// Sentry error handler
Sentry.setupExpressErrorHandler(app)

// Global error handler middleware
app.use(globalErrorHandler)

// Listen
server.listen(expressPort, () => {
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

export { server }
export default app
