// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { createActivity, deleteActivity, getActivity, getActivities, patchActivity } from '../controllers/activityController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/activities
 * @desc Create a new activity
 * @access Public
 * @param {string} req.body.name - The name of the activity.
 * @param {string} req.body.roomId - The id of the room the activity is in.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created activity.
 */
router.post('/',
	asyncErrorHandler(createActivity)
)

/**
 * @route GET api/v1/activities/:id
 * @desc Get an activity
 * @access Public
 * @param {string} req.params.id - The id of the activity to be fetched.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The activity.
 */
router.get('/:id',
	asyncErrorHandler(getActivity)
)

/**
 * @route GET api/v1/activities
 * @desc Get all activities
 * @access Public
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The activities.
 */
router.get('/',
	asyncErrorHandler(getActivities)
)

/**
 * @route PATCH api/v1/activities/:id
 * @desc Update an activity
 * @access Public
 * @param {string} req.params.id - The id of the activity to be patched.
 * @param {string} [req.body.name] - The name of the activity (optional).
 * @param {string} [req.body.roomId] - The id of the room the activity is in (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated activity.
 */
router.patch('/:id',
	asyncErrorHandler(patchActivity)
)

/**
 * @route DELETE api/v1/activities/:id
 * @desc Delete an activity
 * @access Public
 * @param {string} req.params.id - The id of the activity to be deleted.
 * @param {boolean} req.body.confirm - Confirm the deletion.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	asyncErrorHandler(deleteActivity)
)

export default router
