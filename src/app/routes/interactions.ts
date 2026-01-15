import { Router } from 'express'

import { createInteractions, getInteractions } from '../controllers/interactionController.js'
import { isAdmin, isKiosk } from '../middleware/authorization.js'

const router = Router()

/**
 * @route POST /api/v1/interactions
 * @description Create a batch of interactions for a session
 * @access Private (Kiosk only)
 * @middleware isKiosk
 * @param {string} req.body.sessionId - The session ID
 * @param {Array<{type: string, timestamp: string}>} req.body.interactions - Array of interactions
 * @returns {number} res.status - The status code of the HTTP response
 * @returns {Object} res.body - { created: number }
 */
router.post('/',
	isKiosk,
	createInteractions
)

/**
 * @route GET /api/v1/interactions
 * @description Get interactions with optional filters
 * @access Private (Admin only)
 * @middleware isAdmin
 * @query {string} [sessionId] - Filter by session ID
 * @query {string} [kioskId] - Filter by kiosk ID
 * @query {string} [from] - Filter by timestamp (ISO string)
 * @query {string} [to] - Filter by timestamp (ISO string)
 * @returns {number} res.status - The status code of the HTTP response
 * @returns {Array} res.body - Array of interactions
 */
router.get('/',
	isAdmin,
	getInteractions
)

export default router
