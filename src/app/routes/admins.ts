import { Router } from 'express'

import {
	createAdmin,
	deleteAdmin,
	getAdmins,
	patchAdmin,
	getMe
} from '../controllers/adminController.js'
import { isAdmin } from '../middleware/authorization.js'
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

const router = Router()

/**
 * @route POST /api/v1/admins
 * @description Create a new admin.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.body.name - The name of the admin.
 * @param {string} req.body.password - The password of the admin.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The newly created admin.
 */
router.post('/',
	isAdmin,
	asyncErrorHandler(createAdmin)
)

/**
 * @route GET /api/v1/admins
 * @description Get all admins.
 * @access Private
 * @middleware isAdmin
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Array<Object>} res.body - The list of admins.
 */
router.get('/',
	isAdmin,
	asyncErrorHandler(getAdmins)
)

/**
 * @route GET /api/v1/admins/me
 * @description Get the currently logged-in admin.
 * @access Private
 * @middleware isAdmin
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The admin.
 */
router.get('/me',
	isAdmin,
	asyncErrorHandler(getMe)
)

/**
 * @route PATCH /api/v1/admins/:id
 * @description Update an admin by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the admin to be updated.
 * @param {string} [req.body.name] - The new name of the admin (optional).
 * @param {string} [req.body.password] - The new password of the admin (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated admin.
 */
router.patch('/:id',
	isAdmin,
	asyncErrorHandler(patchAdmin)
)

/**
 * @route DELETE /api/v1/admins/:id
 * @description Delete an admin by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the admin to be deleted.
 * @param {boolean} req.body.confirm - Confirmation of the deletion.
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	asyncErrorHandler(deleteAdmin)
)

export default router
