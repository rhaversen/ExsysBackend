// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'
import { isAdmin } from '../middleware/authorization.js'

// Controller functions
import { createAdmin, deleteAdmin, getAdmins, patchAdmin } from '../controllers/adminController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/admins
 * @desc Create a new admin
 * @access Private
 * @param {string} req.body.name - The name of the admin optional.
 * @param {string} req.body.password - The password of the admin.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created admin.
 */
router.post('/',
	isAdmin,
	asyncErrorHandler(createAdmin)
)

/**
 * @route GET api/v1/admins
 * @desc Get all admins
 * @access Private
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The admins.
 */
router.get('/',
	isAdmin,
	asyncErrorHandler(getAdmins)
)

/**
 * @route PATCH api/v1/admins/:id
 * @desc Update an admin
 * @access Private
 * @param {string} req.params.id - The id of the admin to be patched.
 * @param {string} [req.body.name] - The name of the admin (optional).
 * @param {string} [req.body.password] - The password of the admin (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated admin.
 */
router.patch('/:id',
	isAdmin,
	asyncErrorHandler(patchAdmin)
)

/**
 * @route DELETE api/v1/admins/:id
 * @desc Delete an admin
 * @access Private
 * @param {string} req.params.id - The id of the admin to be deleted.
 * @param {boolean} req.body.confirm - Confirm the deletion.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	asyncErrorHandler(deleteAdmin)
)

export default router
