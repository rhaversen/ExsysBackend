import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

import FeedbackModel from '../models/Feedback.js'
import logger from '../utils/logger.js'
import { emitFeedbackCreated, emitFeedbackUpdated, emitFeedbackDeleted } from '../webSockets/feedbackHandlers.js'

export async function createFeedback (req: Request, res: Response, next: NextFunction): Promise<void> {
	const feedbackText = req.body.feedback ?? 'N/A'
	const feedbackName = req.body.name
	logger.info(`Attempting to create feedback with text: ${feedbackText}${feedbackName !== undefined ? ` by ${feedbackName as string}` : ''}`)

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		feedback: req.body.feedback,
		name: req.body.name
	}

	// Remove undefined fields to prevent issues with Mongoose defaults or required fields if not provided
	Object.keys(allowedFields).forEach(key => {
		if (allowedFields[key] === undefined) {
			delete allowedFields[key]
		}
	})

	try {
		const newFeedback = await FeedbackModel.create(allowedFields)
		logger.debug(`Feedback created successfully: ID ${newFeedback.id}, Text: ${newFeedback.feedback}${newFeedback.name !== undefined ? `, Name: ${newFeedback.name}` : ''}`)
		res.status(201).json(newFeedback)
		emitFeedbackCreated(newFeedback)
	} catch (error) {
		logger.error(`Feedback creation failed for text: ${feedbackText}${feedbackName !== undefined ? ` by ${feedbackName as string}` : ''}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getFeedback (req: Request, res: Response, next: NextFunction): Promise<void> {
	const feedbackId = req.params.id
	logger.debug(`Getting feedback: ID ${feedbackId}`)

	try {
		const feedback = await FeedbackModel.findById(feedbackId)

		if (feedback === null || feedback === undefined) {
			logger.warn(`Get feedback failed: Feedback not found. ID: ${feedbackId}`)
			res.status(404).json({ error: 'Feedback not found' })
			return
		}

		logger.debug(`Retrieved feedback successfully: ID ${feedbackId}`)
		res.status(200).json(feedback)
	} catch (error) {
		logger.error(`Get feedback failed: Error retrieving feedback ID ${feedbackId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getFeedbacks (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting all feedbacks')

	try {
		const feedbacks = await FeedbackModel.find()
		logger.debug(`Retrieved ${feedbacks.length} feedbacks successfully`)
		res.status(200).json(feedbacks)
	} catch (error) {
		logger.error('Get feedbacks failed: Error retrieving all feedbacks', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchFeedback (req: Request, res: Response, next: NextFunction): Promise<void> {
	const feedbackId = req.params.id
	logger.debug(`Attempting to update feedback: ID ${feedbackId}`)

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		const feedback = await FeedbackModel.findById(feedbackId).session(session)

		if (feedback === null || feedback === undefined) {
			logger.warn(`Patch feedback failed: Feedback not found. ID: ${feedbackId}`)
			res.status(404).json({ error: 'Feedback not found' })
			await session.abortTransaction()
			await session.endSession()
			return
		}

		let updateApplied = false

		if (req.body.feedback !== undefined && feedback.feedback !== req.body.feedback) {
			logger.debug(`Updating feedback text for feedback ID ${feedbackId}`)
			feedback.feedback = req.body.feedback
			updateApplied = true
		}

		if (req.body.read !== undefined && feedback.read !== req.body.read) {
			logger.debug(`Updating read status for feedback ID ${feedbackId}`)
			feedback.read = req.body.read
			updateApplied = true
		}

		if (req.body.name !== undefined && feedback.name !== req.body.name) {
			logger.debug(`Updating name for feedback ID ${feedbackId}`)
			feedback.name = req.body.name
			updateApplied = true
		} else if (req.body.name === null && feedback.name !== undefined) { // Allow explicitly setting name to null/undefined
			logger.debug(`Removing name for feedback ID ${feedbackId}`)
			feedback.name = undefined
			updateApplied = true
		}

		if (!updateApplied) {
			logger.info(`Patch feedback: No changes detected for feedback ID ${feedbackId}`)
			res.status(200).json(feedback) // Return current state if no changes
			await session.commitTransaction()
			await session.endSession()
			return
		}

		await feedback.validate()
		const updatedFeedback = await feedback.save({ session })

		await session.commitTransaction()

		logger.info(`Feedback updated successfully: ID ${updatedFeedback.id}`)
		res.status(200).json(updatedFeedback)
		emitFeedbackUpdated(updatedFeedback)
	} catch (error) {
		await session.abortTransaction()
		logger.error(`Patch feedback failed: Error updating feedback ID ${feedbackId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	} finally {
		await session.endSession()
	}
}

export async function deleteFeedback (req: Request, res: Response, next: NextFunction): Promise<void> {
	const feedbackId = req.params.id
	logger.info(`Attempting to delete feedback: ID ${feedbackId}`)

	try {
		const deletedFeedback = await FeedbackModel.findByIdAndDelete(feedbackId)

		if (deletedFeedback === null || deletedFeedback === undefined) {
			logger.warn(`Delete feedback failed: Feedback not found. ID: ${feedbackId}`)
			res.status(404).json({ error: 'Feedback not found' })
			return
		}

		logger.info(`Feedback deleted successfully: ID ${deletedFeedback.id}`)
		res.status(200).json({ message: 'Feedback deleted successfully', id: deletedFeedback.id })
		emitFeedbackDeleted(deletedFeedback.id) // Send ID or the deleted object
	} catch (error) {
		logger.error(`Delete feedback failed: Error deleting feedback ID ${feedbackId}`, { error })
		if (error instanceof mongoose.Error.CastError) { // CastError can happen if ID format is invalid
			res.status(400).json({ error: 'Invalid feedback ID format' })
		} else {
			next(error)
		}
	}
}
