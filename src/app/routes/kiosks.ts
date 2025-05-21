import { Router } from 'express'

import {
	createKiosk,
	createNewKioskTag,
	deleteKiosk,
	getKiosk,
	getKiosks,
	getMe,
	patchKiosk
} from '../controllers/kioskController.js'
import { isAdmin, isAdminOrKiosk, isKiosk } from '../middleware/authorization.js'

const router = Router()

/**
 * @route POST /api/v1/kiosks
 * @description Create a new kiosk.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.body.name - The name of the kiosk.
 * @param {string} [req.body.kioskTag] - The tag of the kiosk (optional).
 * @param {string} [req.body.readerId] - The ID of the reader the kiosk should send checkouts to (optional).
 * @param {Array<{activityId: Types.ObjectId}>} [req.body.priorityActivities] - The activities that are promoted for this kiosk (optional).
 * @param {Array<{activityId: Types.ObjectId}>} [req.body.disabledActivities] - The activities that are disabled for this kiosk (optional).
 * @param {Date} [req.body.deactivatedUntil] - The date the kiosk is deactivated until (optional).
 * @param {boolean} [req.body.deactivated] - Whether the kiosk is deactivated (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The newly created kiosk.
 */
router.post('/',
	isAdmin,
	createKiosk
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
	getMe
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
	getKiosk
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
	getKiosks
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
 * @param {Array<{activityId: Types.ObjectId}>} [req.body.priorityActivities] - The activities that are promoted for this kiosk (optional).
 * @param {Array<{activityId: Types.ObjectId}>} [req.body.disabledActivities] - The activities that are disabled for this kiosk (optional).
 * @param {Date} [req.body.deactivatedUntil] - The date the kiosk is deactivated until (optional).
 * @param {boolean} [req.body.deactivated] - Whether the kiosk is deactivated (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated kiosk.
 */
router.patch('/:id',
	isAdmin,
	patchKiosk
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
	createNewKioskTag
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
	deleteKiosk
)

export default router
