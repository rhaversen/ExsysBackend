import { type NextFunction, type Request, type Response } from 'express'
import mongoose, { type FlattenMaps } from 'mongoose'

import {
	FeedbackMessageModel,
	IFeedbackMessage,
	IFeedbackMessageFrontend
} from '../models/FeedbackMessage.js'
import {
	FeedbackRatingModel,
	IFeedbackRating,
	IFeedbackRatingFrontend
} from '../models/FeedbackRating.js'
import { IKiosk } from '../models/Kiosk.js'
import logger from '../utils/logger.js'

export function transformFeedbackMessage (
	doc: IFeedbackMessage | FlattenMaps<IFeedbackMessage>
): IFeedbackMessageFrontend {
	return {
		_id: doc._id.toString(),
		message: doc.message,
		name: doc.name,
		isRead: doc.isRead,
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt
	}
}

export function transformFeedbackRating (
	doc: IFeedbackRating | FlattenMaps<IFeedbackRating>
): IFeedbackRatingFrontend {
	return {
		_id: doc._id.toString(),
		kioskId: doc.kioskId.toString(),
		rating: doc.rating,
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt
	}
}

export async function createFeedbackMessage (req: Request, res: Response, next: NextFunction): Promise<void> {
	const messageText = req.body.message ?? 'N/A'
	const messageName = req.body.name
	logger.info(`Creating feedback message: ${messageText}${messageName !== undefined ? ` by ${messageName as string}` : ''}`)

	const allowedFields: Record<string, unknown> = {
		message: req.body.message,
		name: req.body.name
	}

	Object.keys(allowedFields).forEach(key => {
		if (allowedFields[key] === undefined) {
			delete allowedFields[key]
		}
	})

	try {
		const newMessage = await FeedbackMessageModel.create(allowedFields)
		logger.debug(`Feedback message created: ID ${newMessage.id}`)
		res.status(201).json(transformFeedbackMessage(newMessage))
	} catch (error) {
		logger.error(`Feedback message creation failed: ${messageText}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getFeedbackMessage (req: Request, res: Response, next: NextFunction): Promise<void> {
	const messageId = req.params.id
	logger.debug(`Getting feedback message: ID ${messageId}`)

	try {
		const message = await FeedbackMessageModel.findById(messageId).lean()

		if (message === null || message === undefined) {
			logger.warn(`Get feedback message failed: Not found. ID: ${messageId}`)
			res.status(404).json({ error: 'Feedback message not found' })
			return
		}

		logger.debug(`Retrieved feedback message: ID ${messageId}`)
		res.status(200).json(transformFeedbackMessage(message))
	} catch (error) {
		logger.error(`Get feedback message failed: ID ${messageId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getFeedbackMessages (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting all feedback messages')

	try {
		const messages = await FeedbackMessageModel.find().lean()
		logger.debug(`Retrieved ${messages.length} feedback messages`)
		res.status(200).json(messages.map(transformFeedbackMessage))
	} catch (error) {
		logger.error('Get feedback messages failed', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchFeedbackMessage (req: Request, res: Response, next: NextFunction): Promise<void> {
	const messageId = req.params.id
	logger.debug(`Updating feedback message: ID ${messageId}`)

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		const message = await FeedbackMessageModel.findById(messageId).session(session)

		if (message === null || message === undefined) {
			logger.warn(`Patch feedback message failed: Not found. ID: ${messageId}`)
			res.status(404).json({ error: 'Feedback message not found' })
			await session.abortTransaction()
			await session.endSession()
			return
		}

		let updateApplied = false

		if (req.body.message !== undefined && message.message !== req.body.message) {
			logger.debug(`Updating message text for ID ${messageId}`)
			message.message = req.body.message
			updateApplied = true
		}

		if (req.body.isRead !== undefined && message.isRead !== req.body.isRead) {
			logger.debug(`Updating isRead status for ID ${messageId}`)
			message.isRead = req.body.isRead
			updateApplied = true
		}

		if (req.body.name !== undefined && message.name !== req.body.name) {
			logger.debug(`Updating name for ID ${messageId}`)
			message.name = req.body.name
			updateApplied = true
		} else if (req.body.name === null && message.name !== undefined) {
			logger.debug(`Removing name for ID ${messageId}`)
			message.name = undefined
			updateApplied = true
		}

		if (!updateApplied) {
			logger.info(`Patch feedback message: No changes for ID ${messageId}`)
			res.status(200).json(transformFeedbackMessage(message))
			await session.commitTransaction()
			await session.endSession()
			return
		}

		await message.validate()
		const updatedMessage = await message.save({ session })

		await session.commitTransaction()

		logger.info(`Feedback message updated: ID ${updatedMessage.id}`)
		res.status(200).json(transformFeedbackMessage(updatedMessage))
	} catch (error) {
		await session.abortTransaction()
		logger.error(`Patch feedback message failed: ID ${messageId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	} finally {
		await session.endSession()
	}
}

export async function deleteFeedbackMessage (req: Request, res: Response, next: NextFunction): Promise<void> {
	const messageId = req.params.id
	logger.info(`Deleting feedback message: ID ${messageId}`)

	try {
		const deletedMessage = await FeedbackMessageModel.findById(messageId)
		await deletedMessage?.deleteOne()

		if (deletedMessage === null || deletedMessage === undefined) {
			logger.warn(`Delete feedback message failed: Not found. ID: ${messageId}`)
			res.status(404).json({ error: 'Feedback message not found' })
			return
		}

		logger.info(`Feedback message deleted: ID ${deletedMessage.id}`)
		res.status(200).json({ message: 'Feedback message deleted successfully', id: deletedMessage.id })
	} catch (error) {
		logger.error(`Delete feedback message failed: ID ${messageId}`, { error })
		if (error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: 'Invalid feedback message ID format' })
		} else {
			next(error)
		}
	}
}

export async function createFeedbackRating (req: Request, res: Response, next: NextFunction): Promise<void> {
	const rating = req.body.rating
	const kiosk = req.user as IKiosk
	const kioskId = kiosk._id

	logger.info(`Creating feedback rating: ${rating as string} from kiosk ${kioskId.toString()}`)

	try {
		const newRating = await FeedbackRatingModel.create({
			kioskId,
			rating
		})
		logger.debug(`Feedback rating created: ID ${newRating.id}`)
		res.status(201).json(transformFeedbackRating(newRating))
	} catch (error) {
		logger.error(`Feedback rating creation failed for kiosk ${kioskId.toString()}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getFeedbackRatings (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting all feedback ratings')

	try {
		const ratings = await FeedbackRatingModel.find().sort({ createdAt: -1 }).lean()
		logger.debug(`Retrieved ${ratings.length} feedback ratings`)
		res.status(200).json(ratings.map(transformFeedbackRating))
	} catch (error) {
		logger.error('Get feedback ratings failed', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function deleteFeedbackRating (req: Request, res: Response, next: NextFunction): Promise<void> {
	const ratingId = req.params.id
	logger.info(`Deleting feedback rating: ID ${ratingId}`)

	try {
		const deletedRating = await FeedbackRatingModel.findByIdAndDelete(ratingId)

		if (deletedRating === null) {
			logger.warn(`Delete feedback rating failed: Not found. ID: ${ratingId}`)
			res.status(404).json({ error: 'Feedback rating not found' })
			return
		}

		logger.debug(`Feedback rating deleted: ID ${ratingId}`)
		res.status(200).json(transformFeedbackRating(deletedRating))
	} catch (error) {
		logger.error(`Delete feedback rating failed: ID ${ratingId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
