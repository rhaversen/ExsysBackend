// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { createAdmin, deleteAdmin, getAdmins, patchAdmin } from '../controllers/adminController.js'

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

/**
 * @route GET api/v1/admins
 * @desc Get all admins
 * @access Public
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The admins.
 */
router.get('/',
	asyncErrorHandler(getAdmins)
)

/**
 * @route PATCH api/v1/admins/:id
 * @desc Update an admin
 * @access Public
 * @param {string} req.params.id - The id of the admin to be patched.
 * @param {string} [req.body.name] - The name of the admin (optional).
 * @param {string} [req.body.email] - The email of the admin (optional).
 * @param {string} [req.body.password] - The password of the admin (optional).
 * @param {string} [req.body.confirmPassword] - The confirmation of the password of the admin (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated admin.
 */
router.patch('/:id',
	asyncErrorHandler(patchAdmin)
)

/**
 * @route DELETE api/v1/admins/:id
 * @desc Delete an admin
 * @access Public
 * @param {string} req.params.id - The id of the admin to be deleted.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	asyncErrorHandler(deleteAdmin)
)

export default router
