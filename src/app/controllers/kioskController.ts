import { type NextFunction, type Request, type Response } from 'express'
import mongoose, { type FlattenMaps } from 'mongoose'

import KioskModel, { type IKiosk, type IKioskFrontend } from '../models/Kiosk.js'
import logger from '../utils/logger.js'

export function transformKiosk (
	kiosk: IKiosk | FlattenMaps<IKiosk>
): IKioskFrontend {
	return {
		_id: kiosk._id.toString(),
		name: kiosk.name,
		readerId: kiosk.readerId?.toString() ?? null,
		kioskTag: kiosk.kioskTag,
		priorityActivities: kiosk.priorityActivities.map((activity) => activity.toString()),
		disabledActivities: kiosk.disabledActivities.map((activity) => activity.toString()),
		deactivated: kiosk.deactivated,
		deactivatedUntil: kiosk.deactivatedUntil?.toString() ?? null,
		createdAt: kiosk.createdAt,
		updatedAt: kiosk.updatedAt
	}
}

export async function createKiosk (req: Request, res: Response, next: NextFunction): Promise<void> {
	const kioskName = req.body.name ?? 'N/A'
	logger.info(`Attempting to create kiosk with name: ${kioskName}`)

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		name: req.body.name,
		kioskTag: req.body.kioskTag,
		readerId: req.body.readerId,
		priorityActivities: req.body.priorityActivities,
		disabledActivities: req.body.disabledActivities,
		deactivated: req.body.deactivated,
		deactivatedUntil: req.body.deactivatedUntil
	}

	try {
		const newKiosk = await KioskModel.create(allowedFields)
		logger.debug(`Kiosk created in DB successfully: ID ${newKiosk.id}, Name: ${newKiosk.name}, Tag: ${newKiosk.kioskTag}`)

		const transformedKiosk = transformKiosk(newKiosk)
		logger.debug(`Kiosk transformed successfully: ID ${newKiosk.id}`)
		res.status(201).json(transformedKiosk)
	} catch (error) {
		logger.error(`Kiosk creation failed for name: ${kioskName}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getMe (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting current kiosk user (me)')

	try {
		const kioskUser = req.user as IKiosk | undefined

		if (kioskUser === null || kioskUser === undefined) {
			logger.error('Get me (kiosk) failed: req.user is undefined despite authentication check.')
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		// Find the kiosk again to ensure fresh data, but without population here
		const kiosk = await KioskModel.findById(kioskUser._id).lean()

		if (!kiosk) {
			// This indicates a data inconsistency if req.user was set but the DB record is gone
			logger.error(`Get me (kiosk) failed: Kiosk not found in DB for authenticated user ID: ${kioskUser._id}`)
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		const transformedKiosk = transformKiosk(kiosk)
		logger.debug(`Retrieved current kiosk successfully: ID ${kiosk.id}, Name: ${kiosk.name}`)
		res.status(200).json(transformedKiosk)
	} catch (error) {
		logger.error('Get me (kiosk) failed: Unexpected error', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getKiosk (req: Request, res: Response, next: NextFunction): Promise<void> {
	const kioskId = req.params.id
	logger.debug(`Getting kiosk: ID ${kioskId}`)

	try {
		const kiosk = await KioskModel.findById(kioskId).lean()

		if (kiosk === null || kiosk === undefined) {
			logger.warn(`Get kiosk failed: Kiosk not found. ID: ${kioskId}`)
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		const transformedKiosk = transformKiosk(kiosk)
		logger.debug(`Retrieved kiosk successfully: ID ${kioskId}`)
		res.status(200).json(transformedKiosk)
	} catch (error) {
		logger.error(`Get kiosk failed: Error retrieving kiosk ID ${kioskId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getKiosks (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting all kiosks')

	try {
		const kiosks = await KioskModel.find({}).lean()
		logger.debug(`Found ${kiosks.length} kiosks in DB`)

		const transformedKiosks = kiosks.map((kiosk) => transformKiosk(kiosk))
		logger.debug(`Retrieved and transformed ${transformedKiosks.length} kiosks`)
		res.status(200).json(transformedKiosks)
	} catch (error) {
		logger.error('Failed to get kiosks', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchKiosk (req: Request, res: Response, next: NextFunction): Promise<void> {
	const kioskId = req.params.id
	logger.info(`Attempting to patch kiosk: ID ${kioskId}`)

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		const kiosk = await KioskModel.findById(kioskId).session(session)

		if (kiosk === null || kiosk === undefined) {
			logger.warn(`Patch kiosk failed: Kiosk not found. ID: ${kioskId}`)
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			await session.abortTransaction()
			await session.endSession()
			return
		}

		let updateApplied = false
		// Set fields directly, checking for undefined to ensure not overwriting with undefined
		if (req.body.name !== undefined && kiosk.name !== req.body.name) {
			logger.debug(`Updating name for kiosk ID ${kioskId}`)
			kiosk.name = req.body.name
			updateApplied = true
		}
		if (req.body.kioskTag !== undefined && kiosk.kioskTag !== req.body.kioskTag) {
			logger.debug(`Updating kioskTag for kiosk ID ${kioskId}`)
			kiosk.kioskTag = req.body.kioskTag
			updateApplied = true
		}
		if (req.body.readerId !== undefined && String(kiosk.readerId) !== String(req.body.readerId)) { // Compare as strings
			logger.debug(`Updating readerId for kiosk ID ${kioskId}`)
			kiosk.readerId = req.body.readerId
			updateApplied = true
		}
		if (req.body.priorityActivities !== undefined) { // Array comparison is complex, log if provided
			logger.debug(`Updating priorityActivities for kiosk ID ${kioskId}`)
			kiosk.priorityActivities = req.body.priorityActivities
			updateApplied = true
		}
		if (req.body.disabledActivities !== undefined) { // Array comparison is complex, log if provided
			logger.debug(`Updating disabledActivities for kiosk ID ${kioskId}`)
			kiosk.disabledActivities = req.body.disabledActivities
			updateApplied = true
		}
		if (req.body.deactivatedUntil !== undefined && kiosk.deactivatedUntil?.toISOString() !== new Date(req.body.deactivatedUntil).toISOString()) { // Compare dates
			logger.debug(`Updating deactivatedUntil for kiosk ID ${kioskId}`)
			kiosk.deactivatedUntil = req.body.deactivatedUntil
			updateApplied = true
		}
		if (req.body.deactivated !== undefined && kiosk.deactivated !== req.body.deactivated) {
			logger.debug(`Updating deactivated status for kiosk ID ${kioskId}`)
			kiosk.deactivated = req.body.deactivated
			updateApplied = true
		}

		if (!updateApplied) {
			logger.info(`Patch kiosk: No changes detected for kiosk ID ${kioskId}`)
			const transformedKiosk = transformKiosk(kiosk)
			res.status(200).json(transformedKiosk) // Return current transformed state if no changes
			await session.commitTransaction()
			await session.endSession()
			return
		}

		// Validate and save the updated document
		await kiosk.validate()
		await kiosk.save({ session })
		logger.debug(`Kiosk saved successfully in transaction: ID ${kioskId}`)

		// Re-fetch the document *without* population here to pass to transform
		// This ensures the transform function gets the latest saved state before populating
		const updatedKiosk = await KioskModel.findById(kiosk._id).session(session).exec()

		if (!updatedKiosk) {
			// This should not happen if save was successful, but check for safety
			await session.abortTransaction()
			logger.error(`Patch kiosk failed: Could not re-fetch kiosk after save. ID: ${kioskId}`)
			throw new Error('Failed to re-fetch updated kiosk')
		}

		await session.commitTransaction()
		logger.info(`Kiosk patched successfully: ID ${kioskId}`)

		const transformedKiosk = transformKiosk(updatedKiosk)
		res.status(200).json(transformedKiosk)
	} catch (error) {
		await session.abortTransaction()
		logger.error(`Patch kiosk failed: Error updating kiosk ID ${kioskId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	} finally {
		await session.endSession()
	}
}

export async function createNewKioskTag (req: Request, res: Response, next: NextFunction): Promise<void> {
	const kioskId = req.params.id
	logger.info(`Attempting to generate new kioskTag for kiosk: ID ${kioskId}`)

	try {
		const kiosk = await KioskModel.findById(kioskId)

		if (kiosk === null || kiosk === undefined) {
			logger.warn(`Generate new kioskTag failed: Kiosk not found. ID: ${kioskId}`)
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		const oldTag = kiosk.kioskTag
		const newTag = await kiosk.generateNewKioskTag() // This method saves the kiosk

		logger.info(`New kioskTag generated successfully for kiosk ID ${kioskId}: ${oldTag} -> ${newTag}`)
		res.status(200).json({ kioskTag: newTag })
	} catch (error) {
		logger.error(`Generate new kioskTag failed for kiosk ID ${kioskId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function deleteKiosk (req: Request, res: Response, next: NextFunction): Promise<void> {
	const kioskId = req.params.id
	logger.info(`Attempting to delete kiosk: ID ${kioskId}`)

	if (req.body?.confirm !== true) {
		logger.warn(`Kiosk deletion failed: Confirmation not provided for ID ${kioskId}`)
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const kiosk = await KioskModel.findById(kioskId)
		await kiosk?.deleteOne()

		if (kiosk === null || kiosk === undefined) {
			logger.warn(`Kiosk deletion failed: Kiosk not found. ID: ${kioskId}`)
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		logger.info(`Kiosk deleted successfully: ID ${kioskId}, Name: ${kiosk.name}, Tag: ${kiosk.kioskTag}`)
		res.status(204).send()
	} catch (error) {
		logger.error(`Kiosk deletion failed: Error during deletion process for ID ${kioskId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
