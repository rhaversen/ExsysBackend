import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

import ActivityModel, { IActivity, IActivityFrontend } from '../models/Activity.js'
import logger from '../utils/logger.js'

export function transformActivity (
	activityDoc: IActivity
): IActivityFrontend {
	return {
		_id: activityDoc.id,
		name: activityDoc.name,
		priorityRooms: activityDoc.priorityRooms.map((room) => room.toString()),
		disabledProducts: activityDoc.disabledProducts.map((product) => product.toString()),
		disabledRooms: activityDoc.disabledRooms.map((room) => room.toString()),
		createdAt: activityDoc.createdAt,
		updatedAt: activityDoc.updatedAt
	}
}

export async function createActivity (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.info(`Attempting to create activity with name: ${req.body.name ?? 'N/A'}`)

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		name: req.body.name,
		priorityRooms: req.body.priorityRooms,
		disabledProducts: req.body.disabledProducts,
		disabledRooms: req.body.disabledRooms
	}

	try {
		const newActivity = await ActivityModel.create(allowedFields)
		logger.debug(`Activity created successfully: ID ${newActivity.id}`)
		res.status(201).json(transformActivity(newActivity))
	} catch (error) {
		logger.error(`Activity creation failed for name: ${req.body.name ?? 'N/A'}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getActivity (req: Request, res: Response, next: NextFunction): Promise<void> {
	const activityId = req.params.id
	logger.debug(`Getting activity: ID ${activityId}`)

	try {
		const activity = await ActivityModel.findById(activityId)

		if (activity === null || activity === undefined) {
			logger.warn(`Get activity failed: Activity not found. ID: ${activityId}`)
			res.status(404).json({ error: 'Aktivitet ikke fundet' })
			return
		}

		logger.debug(`Retrieved activity successfully: ID ${activityId}`)
		res.status(200).json(transformActivity(activity))
	} catch (error) {
		logger.error(`Get activity failed: Error retrieving activity ID ${activityId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getActivities (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting all activities')

	try {
		const activities = await ActivityModel.find({})
		logger.debug(`Retrieved ${activities.length} activities`)
		res.status(200).json(activities.map(transformActivity))
	} catch (error) {
		logger.error('Failed to get activities', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchActivity (req: Request, res: Response, next: NextFunction): Promise<void> {
	const activityId = req.params.id
	logger.info(`Attempting to patch activity: ID ${activityId}`)

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		const activity = await ActivityModel.findById(activityId).session(session)

		if (activity === null || activity === undefined) {
			logger.warn(`Patch activity failed: Activity not found. ID: ${activityId}`)
			res.status(404).json({ error: 'Aktivitet ikke fundet' })
			await session.abortTransaction()
			await session.endSession()
			return
		}

		let updateApplied = false
		// Manually set each field from allowed fields if it's present in the request body
		if (req.body.name !== undefined && activity.name !== req.body.name) {
			logger.debug(`Updating name for activity ID ${activityId}`)
			activity.name = req.body.name
			updateApplied = true
		}
		if (req.body.priorityRooms !== undefined) {
			logger.debug(`Updating priorityRooms for activity ID ${activityId}`)
			activity.priorityRooms = req.body.priorityRooms
			updateApplied = true
		}
		if (req.body.disabledProducts !== undefined) {
			logger.debug(`Updating disabledProducts for activity ID ${activityId}`)
			activity.disabledProducts = req.body.disabledProducts
			updateApplied = true
		}
		if (req.body.disabledRooms !== undefined) {
			logger.debug(`Updating disabledRooms for activity ID ${activityId}`)
			activity.disabledRooms = req.body.disabledRooms
			updateApplied = true
		}

		if (!updateApplied) {
			logger.info(`Patch activity: No changes detected for activity ID ${activityId}`)
			res.status(200).json(transformActivity(activity)) // Return current state if no changes
			await session.commitTransaction()
			await session.endSession()
			return
		}

		// Validate and save the updated document
		await activity.validate()
		await activity.save({ session })

		await session.commitTransaction()
		logger.info(`Activity patched successfully: ID ${activityId}`)
		res.status(200).json(transformActivity(activity))
	} catch (error) {
		await session.abortTransaction()
		logger.error(`Patch activity failed: Error updating activity ID ${activityId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	} finally {
		await session.endSession()
	}
}

export async function deleteActivity (req: Request, res: Response, next: NextFunction): Promise<void> {
	const activityId = req.params.id
	logger.info(`Attempting to delete activity: ID ${activityId}`)

	// Check if req.body exists and if confirm is true
	if (req.body?.confirm !== true) {
		logger.warn(`Activity deletion failed: Confirmation not provided or invalid for ID ${activityId}`)
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const activity = await ActivityModel.findById(activityId)
		await activity?.deleteOne()

		if (activity === null || activity === undefined) {
			logger.warn(`Activity deletion failed: Activity not found. ID: ${activityId}`)
			res.status(404).json({ error: 'Aktivitet ikke fundet' })
			return
		}

		logger.info(`Activity deleted successfully: ID ${activityId}`)
		res.status(204).send()
	} catch (error) {
		logger.error(`Activity deletion failed: Error during deletion process for ID ${activityId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
