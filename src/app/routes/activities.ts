import { Router } from 'express'

import {
	createActivity,
	deleteActivity,
	getActivities,
	getActivity,
	patchActivity
} from '../controllers/activityController.js'
import { isAdmin, isAdminOrKiosk } from '../middleware/authorization.js'
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

const router = Router()

/**
 * @route POST /api/v1/activities
 * @description Create a new activity.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.body.name - The name of the activity.
 * @param {string[]} req.body.rooms - The rooms the activity can dine in.
 * @param {string[]} req.body.disabledProducts - The products that are disabled for this activity.
 * @param {string[]} req.body.disabledRooms - The rooms that are disabled for this activity.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The newly created activity.
 */
router.post('/',
	isAdmin,
	asyncErrorHandler(createActivity)
)

/**
 * @route GET /api/v1/activities/:id
 * @description Get an activity by its ID.
 * @access Private
 * @middleware isAdminOrKiosk
 * @param {string} req.params.id - The ID of the activity to be fetched.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The activity details.
 */
router.get('/:id',
	isAdminOrKiosk,
	asyncErrorHandler(getActivity)
)

/**
 * @route GET /api/v1/activities
 * @description Get all activities.
 * @access Private
 * @middleware isAdminOrKiosk
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Array<Object>} res.body - The list of activities.
 */
router.get('/',
	isAdminOrKiosk,
	asyncErrorHandler(getActivities)
)

/**
 * @route PATCH /api/v1/activities/:id
 * @description Update an activity by its ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the activity to be patched.
 * @param {string} [req.body.name] - The new name of the activity (optional).
 * @param {string[]} [req.body.rooms] - The new rooms the activity can dine in (optional).
 * @param {string[]} [req.body.disabledProducts] - The new products that are disabled for this activity (optional).
 * @param {string[]} [req.body.disabledRooms] - The new rooms that are disabled for this activity (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated activity.
 */
router.patch('/:id',
	isAdmin,
	asyncErrorHandler(patchActivity)
)

/**
 * @route DELETE /api/v1/activities/:id
 * @description Delete an activity by its ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the activity to be deleted.
 * @param {boolean} req.body.confirm - Confirmation of the deletion.
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	asyncErrorHandler(deleteActivity)
)

export default router
