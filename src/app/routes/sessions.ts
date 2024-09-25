// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'
import { isAdmin } from '../middleware/authorization.js'

// Controller functions
import { deleteSession, getSessions } from '../controllers/sessionController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route GET api/v1/sessions
 * @desc Get all sessions
 * @access Private
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - An array of session objects.
 */
router.get('/',
	isAdmin,
	asyncErrorHandler(getSessions)
)

/**
 * @route DELETE api/v1/sessions/:id
 * @desc Delete a session
 * @access Private
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	asyncErrorHandler(deleteSession)
)

export default router
