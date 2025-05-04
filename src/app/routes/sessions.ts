import { Router } from 'express'

import {
	deleteSession,
	getCurrentSession,
	getSessions
} from '../controllers/sessionController.js'
import { isAdmin } from '../middleware/authorization.js'

const router = Router()

/**
 * @route GET /api/v1/sessions
 * @description Get all sessions.
 * @access Private
 * @middleware isAdmin
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Array<Object>} res.body - An array of session objects.
 */
router.get('/',
	isAdmin,
	getSessions
)

/**
 * @route GET /api/v1/sessions/current
 * @description Get the current session.
 * @access Private
 * @middleware isAdmin
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The current session object.
 */
router.get('/current',
	isAdmin,
	getCurrentSession
)

/**
 * @route DELETE /api/v1/sessions/:id
 * @description Delete a session by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the session to be deleted.
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	deleteSession
)

export default router
