import { Router } from 'express'

import {
	createFeedbackMessage,
	createFeedbackRating,
	deleteFeedbackMessage,
	deleteFeedbackRating,
	getFeedbackMessage,
	getFeedbackMessages,
	getFeedbackRatings,
	patchFeedbackMessage
} from '../controllers/feedbackController.js'
import { isAdmin, isKiosk } from '../middleware/authorization.js'

const router = Router()

/**
 * @route POST /api/v1/feedback/message
 * @description Create new feedback message.
 * @access Public
 * @param {string} req.body.message - The feedback message text.
 * @param {string} [req.body.name] - The name of the person giving feedback (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The newly created feedback message.
 */
router.post('/message', createFeedbackMessage)

/**
 * @route GET /api/v1/feedback/message
 * @description Get all feedback messages.
 * @access Private
 * @middleware isAdmin
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object[]} res.body - Array of feedback message objects.
 */
router.get('/message',
	isAdmin,
	getFeedbackMessages
)

/**
 * @route GET /api/v1/feedback/message/:id
 * @description Get a specific feedback message by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the feedback message to retrieve.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The feedback message object.
 */
router.get('/message/:id',
	isAdmin,
	getFeedbackMessage
)

/**
 * @route PATCH /api/v1/feedback/message/:id
 * @description Update a specific feedback message by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the feedback message to update.
 * @param {string} [req.body.message] - The updated message text (optional).
 * @param {boolean} [req.body.isRead] - The updated isRead status (optional).
 * @param {string} [req.body.name] - The updated name (optional, send null to remove).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated feedback message object.
 */
router.patch('/message/:id',
	isAdmin,
	patchFeedbackMessage
)

/**
 * @route DELETE /api/v1/feedback/message/:id
 * @description Delete a specific feedback message by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the feedback message to delete.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - A success message and the ID of the deleted feedback message.
 */
router.delete('/message/:id',
	isAdmin,
	deleteFeedbackMessage
)

/**
 * @route POST /api/v1/feedback/rating
 * @description Create new feedback rating (thumbs up/down from kiosk).
 * @access Private (Kiosk only)
 * @middleware isKiosk
 * @param {string} req.body.rating - The rating ('positive' or 'negative').
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The newly created feedback rating.
 */
router.post('/rating',
	isKiosk,
	createFeedbackRating
)

/**
 * @route GET /api/v1/feedback/rating
 * @description Get all feedback ratings.
 * @access Private (Admin only)
 * @middleware isAdmin
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object[]} res.body - Array of feedback rating objects.
 */
router.get('/rating',
	isAdmin,
	getFeedbackRatings
)

/**
 * @route DELETE /api/v1/feedback/rating/:id
 * @description Delete a specific feedback rating by ID.
 * @access Private (Admin only)
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the feedback rating to delete.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The deleted feedback rating object.
 */
router.delete('/rating/:id',
	isAdmin,
	deleteFeedbackRating
)

export default router
