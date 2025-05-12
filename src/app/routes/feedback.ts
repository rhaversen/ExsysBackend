import { Router } from 'express'

import {
	createFeedback,
	deleteFeedback,
	getFeedback,
	getFeedbacks,
	patchFeedback
} from '../controllers/feedbackController.js'
import { isAdmin } from '../middleware/authorization.js'

const router = Router()

/**
 * @route POST /api/v1/feedback
 * @description Create new feedback.
 * @access Public
 * @param {string} req.body.feedback - The feedback text.
 * @param {string} [req.body.name] - The name of the person giving feedback (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The newly created feedback.
 */
router.post('/', createFeedback)

/**
 * @route GET /api/v1/feedback
 * @description Get all feedback.
 * @access Private
 * @middleware isAdmin
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object[]} res.body - Array of feedback objects.
 */
router.get('/', isAdmin, getFeedbacks)

/**
 * @route GET /api/v1/feedback/:id
 * @description Get a specific feedback by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the feedback to retrieve.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The feedback object.
 */
router.get('/:id', isAdmin, getFeedback)

/**
 * @route PATCH /api/v1/feedback/:id
 * @description Update a specific feedback by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the feedback to update.
 * @param {string} [req.body.feedback] - The updated feedback text (optional).
 * @param {boolean} [req.body.read] - The updated read status (optional).
 * @param {string} [req.body.name] - The updated name (optional, send null to remove).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated feedback object.
 */
router.patch('/:id', isAdmin, patchFeedback)

/**
 * @route DELETE /api/v1/feedback/:id
 * @description Delete a specific feedback by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the feedback to delete.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - A success message and the ID of the deleted feedback.
 */
router.delete('/:id', isAdmin, deleteFeedback)

export default router
