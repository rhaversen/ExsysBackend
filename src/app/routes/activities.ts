// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'
import { isAdmin, isAdminOrKiosk } from '../middleware/authorization.js'

// Controller functions
import {
	createActivity,
	deleteActivity,
	getActivities,
	getActivity,
	patchActivity
} from '../controllers/activityController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/activities
 * @desc Create a new activity
 * @access Private
 * @param {string} req.body.name - The name of the activity.
 * @param {string} req.body.roomId - The id of the room the activity is in.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created activity.
 */
router.post('/',
	isAdmin,
	asyncErrorHandler(createActivity)
)

/**
 * @route GET api/v1/activities/:id
 * @desc Get an activity
 * @access Private
 * @param {string} req.params.id - The id of the activity to be fetched.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The activity.
 */
router.get('/:id',
	isAdminOrKiosk,
	asyncErrorHandler(getActivity)
)

/**
 * @route GET api/v1/activities
 * @desc Get all activities
 * @access Private
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The activities.
 */
router.get('/',
	isAdminOrKiosk,
	asyncErrorHandler(getActivities)
)

/**
 * @route PATCH api/v1/activities/:id
 * @desc Update an activity
 * @access Private
 * @param {string} req.params.id - The id of the activity to be patched.
 * @param {string} [req.body.name] - The name of the activity (optional).
 * @param {string} [req.body.roomId] - The id of the room the activity is in (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated activity.
 */
router.patch('/:id',
	isAdmin,
	asyncErrorHandler(patchActivity)
)

/**
 * @route DELETE api/v1/activities/:id
 * @desc Delete an activity
 * @access Private
 * @param {string} req.params.id - The id of the activity to be deleted.
 * @param {boolean} req.body.confirm - Confirm the deletion.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	asyncErrorHandler(deleteActivity)
)

export default router
