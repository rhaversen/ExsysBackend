import { Router } from 'express'
import mongoose from 'mongoose'

import { debugUpdatePaymentStatus } from '../controllers/readerCallbackController.js'
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
 * @description Emit a forced kiosk refresh event. If kioskId query parameter is provided, only that kiosk is refreshed.
 * @access Private
 * @middleware isAdmin
 * @param {string} [req.query.kioskId] - Optional ID of the specific kiosk to refresh.
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/force-kiosk-refresh',
	isAdmin,
	(req, res) => {
		const kioskId = req.query.kioskId as string | undefined
		const status = emitForcedKioskRefresh(kioskId)
		if (status) { res.status(200).send('OK') } else { res.status(500).send('Error') }
	}
)

/**
 * @route POST /api/service/debug-payment-callback
 * @description Debug endpoint to simulate a payment callback using order ID.
 * @access Private (Admin only)
 * @param {string} req.body.orderId - The ID of the order to update payment status for.
 * @param {string} req.body.status - The payment status ('successful' or 'failed').
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - Confirmation message.
 */
router.post('/debug-payment-callback',
	isAdmin,
	debugUpdatePaymentStatus
)

export default router
