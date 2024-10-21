// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'
import { isAdmin } from '../middleware/authorization.js'

// Controller functions
import {
	deleteSession,
	getCurrentSession,
	getSessions
} from '../controllers/sessionController.js'

// Destructuring and global variables
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
	asyncErrorHandler(getSessions)
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
	asyncErrorHandler(getCurrentSession)
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
	asyncErrorHandler(deleteSession)
)

export default router
