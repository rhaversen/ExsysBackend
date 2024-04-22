// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { createAdmin } from '../controllers/adminController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/admins
 * @desc Create a new admin
 * @access Public
 * @param {string} [req.body.name] - The name of the admin (optional).
 * @param {string} req.body.email - The email of the admin.
 * @param {string} req.body.password - The password of the admin.
 * @param {string} req.body.confirmPassword - The confirmation of the password of the admin.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created admin.
 */
router.post('/',
	asyncErrorHandler(createAdmin)
)

export default router
