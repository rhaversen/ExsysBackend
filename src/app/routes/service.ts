import { Router } from 'express'
import mongoose from 'mongoose'

import { isAdmin } from '../middleware/authorization.js'
import logger from '../utils/logger.js'
import { getSocketStatus } from '../utils/socket.js'
import { emitForcedKioskRefresh } from '../webSockets/utils.js'

const router = Router()

/**
 * @route GET /api/service/livez
 * @description Check if the server is live.
 * @access Public
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/livez', (_req, res) => {
	res.status(200).send('OK')
})

/**
 * @route GET /api/service/readyz
 * @description Check if the database and Socket.io are ready.
 * @access Public
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/readyz', (_req, res) => {
	const mongooseReady = mongoose.connection.readyState === 1
	const socketReady = getSocketStatus()
	if (!mongooseReady) { logger.error('MongoDB not ready') }
	if (!socketReady) { logger.error('Socket.io not ready') }
	if (mongooseReady && socketReady) {
		res.status(200).send('OK')
	} else {
		res.status(503).send('Database or Socket.io unavailable')
	}
})

/**
 * @route GET /api/service/debug-sentry
 * @description Throw an error to test Sentry.
 * @access Public
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/debug-sentry', () => {
	throw new Error('Sentry error')
})

/**
 * @route GET /api/service/force-kiosk-refresh
 * @description Emit a forced kiosk refresh event.
 * @access Private
 * @middleware isAdmin
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/force-kiosk-refresh',
	isAdmin,
	(_req, res) => {
		const status = emitForcedKioskRefresh()
		if (status) { res.status(200).send('OK') } else { res.status(500).send('Error') }
	}
)

export default router
