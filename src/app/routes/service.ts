// Node.js built-in modules

// Third-party libraries
import { Router } from 'express'
import mongoose from 'mongoose'

// Own modules
import { getSocketStatus } from '../utils/socket.js'

// Destructuring and global variables
const router = Router()

/**
 * @route GET /api/service/livez
 * @description Check if the server is live.
 * @access Public
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/livez', (req, res) => {
	res.status(200).send('OK')
})

/**
 * @route GET /api/service/readyz
 * @description Check if the database and Socket.io are ready.
 * @access Public
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/readyz', (req, res) => {
	const mongooseReady = mongoose.connection.readyState === 1
	const socketReady = getSocketStatus()
	if (mongooseReady && socketReady) {
		return res.status(200).send('OK')
	} else {
		return res.status(503).send('Database or Socket.io unavailable')
	}
})

/**
 * @route GET /api/service/debug-sentry
 * @description Throw an error to test Sentry.
 * @access Public
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/debug-sentry', (req, res) => {
	throw new Error('Sentry error')
})

export default router
