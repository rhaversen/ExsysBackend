// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'
import { isAdmin, isAdminOrKiosk, isKiosk } from '../middleware/authorization.js'

// Controller functions
import {
	createKiosk,
	createNewKioskTag,
	deleteKiosk,
	getKiosk,
	getKiosks,
	getMe,
	patchKiosk
} from '../controllers/kioskController.js'

// Environment variables

// Config variables

// Destructuring and global variables
const router = Router()

/**
 * @route POST /api/v1/kiosks
 * @description Create a new kiosk.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.body.name - The name of the kiosk.
 * @param {string} [req.body.kioskTag] - The tag of the kiosk (optional).
 * @param {string} [req.body.readerId] - The ID of the reader the kiosk should send checkouts to (optional).
 * @param {string} req.body.password - The password of the kiosk.
 * @param {Array<{activityId: Types.ObjectId}>} [req.body.activities] - The activities the kiosk is responsible for (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The newly created kiosk.
 */
router.post('/',
	isAdmin,
	asyncErrorHandler(createKiosk)
)

/**
 * @route GET /api/v1/kiosks/me
 * @description Get the currently logged-in kiosk.
 * @access Private
 * @middleware isKiosk
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The kiosk.
 */
router.get('/me',
	isKiosk,
	asyncErrorHandler(getMe)
)

/**
 * @route GET /api/v1/kiosks/:id
 * @description Get a kiosk by its ID.
 * @access Private
 * @middleware isAdminOrKiosk
 * @param {string} req.params.id - The ID of the kiosk to be fetched.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The kiosk details.
 */
router.get('/:id',
	isAdminOrKiosk,
	asyncErrorHandler(getKiosk)
)

/**
 * @route GET /api/v1/kiosks
 * @description Get all kiosks.
 * @access Private
 * @middleware isAdmin
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Array<Object>} res.body - The list of kiosks.
 */
router.get('/',
	isAdmin,
	asyncErrorHandler(getKiosks)
)

/**
 * @route PATCH /api/v1/kiosks/:id
 * @description Update a kiosk.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the kiosk to be updated.
 * @param {string} [req.body.name] - The name of the kiosk (optional).
 * @param {string} [req.body.kioskTag] - The tag of the kiosk (optional).
 * @param {string} [req.body.readerId] - The ID of the reader the kiosk should send checkouts to (optional).
 * @param {string} [req.body.password] - The password of the kiosk (optional).
 * @param {Array<{activityId: Types.ObjectId}>} [req.body.activities] - The activities the kiosk is responsible for (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated kiosk.
 */
router.patch('/:id',
	isAdmin,
	asyncErrorHandler(patchKiosk)
)

/**
 * @route PATCH /api/v1/kiosks/:id/kioskTag
 * @description Create a new kiosk tag.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the kiosk to be updated.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated kiosk with a new kiosk tag.
 */
router.patch('/:id/kioskTag',
	isAdmin,
	asyncErrorHandler(createNewKioskTag)
)

/**
 * @route DELETE /api/v1/kiosks/:id
 * @description Delete a kiosk by its ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the kiosk to be deleted.
 * @param {boolean} req.body.confirm - Confirmation of the deletion.
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	asyncErrorHandler(deleteKiosk)
)

export default router
