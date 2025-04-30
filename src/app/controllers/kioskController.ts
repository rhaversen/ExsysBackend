// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import KioskModel, { type IKiosk, type IKioskFrontend } from '../models/Kiosk.js'
import { emitKioskCreated, emitKioskDeleted, emitKioskUpdated } from '../webSockets/kioskHandlers.js'
import { IActivity } from '../models/Activity.js'
import { IReader } from '../models/Reader.js'

// Environment variables

// Config variables

// Destructuring and global variables

// Make transformKiosk async and handle population internally
export async function transformKiosk (
	kiosk: IKiosk
): Promise<IKioskFrontend> {
	// Populate activities and readerId
	const populatedKiosk = await kiosk.populate<{ activities: IActivity[], readerId: IReader | null }>([
		{ path: 'activities' },
		{ path: 'readerId' }
	])

	return {
		_id: populatedKiosk.id,
		name: populatedKiosk.name,
		readerId: populatedKiosk.readerId,
		kioskTag: populatedKiosk.kioskTag,
		activities: populatedKiosk.activities,
		disabledActivities: populatedKiosk.disabledActivities,
		deactivated: populatedKiosk.deactivated,
		deactivatedUntil: populatedKiosk.deactivatedUntil,
		createdAt: populatedKiosk.createdAt,
		updatedAt: populatedKiosk.updatedAt
	}
}

export async function createKiosk (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating kiosk')

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		name: req.body.name,
		kioskTag: req.body.kioskTag,
		readerId: req.body.readerId,
		activities: req.body.activities,
		disabledActivities: req.body.disabledActivities,
		deactivated: req.body.deactivated,
		deactivatedUntil: req.body.deactivatedUntil
	}

	try {
		const newKiosk = await KioskModel.create(allowedFields)
		// Remove population here

		// Await the async transform function
		const transformedKiosk = await transformKiosk(newKiosk)
		res.status(201).json(transformedKiosk)

		emitKioskCreated(transformedKiosk)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getMe (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting me kiosk')

	try {
		const kioskUser = req.user as IKiosk | undefined

		if (kioskUser === null || kioskUser === undefined) {
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		// Find the kiosk but remove population here
		const kiosk = await KioskModel.findById(kioskUser._id).exec()

		if (!kiosk) {
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		// Await the async transform function
		res.status(200).json(await transformKiosk(kiosk))
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getKiosk (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting kiosk')

	try {
		// Find the kiosk but remove population here
		const kiosk = await KioskModel.findById(req.params.id).exec()

		if (kiosk === null || kiosk === undefined) {
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		// Await the async transform function
		res.status(200).json(await transformKiosk(kiosk))
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getKiosks (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting kiosks')

	try {
		// Find kiosks but remove population here
		const kiosks = await KioskModel.find({}).exec()

		// Await the transformation for each kiosk
		const transformedKiosks = await Promise.all(
			kiosks.map(async (kiosk) => await transformKiosk(kiosk))
		)
		res.status(200).json(transformedKiosks)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchKiosk (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching kiosk')

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		const kiosk = await KioskModel.findById(req.params.id).session(session)

		if (kiosk === null || kiosk === undefined) {
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		// Set fields directly, checking for undefined to ensure not overwriting with undefined
		if (req.body.name !== undefined) kiosk.name = req.body.name
		if (req.body.kioskTag !== undefined) kiosk.kioskTag = req.body.kioskTag
		if (req.body.readerId !== undefined) kiosk.readerId = req.body.readerId
		if (req.body.activities !== undefined) kiosk.activities = req.body.activities
		if (req.body.disabledActivities !== undefined) kiosk.disabledActivities = req.body.disabledActivities
		if (req.body.deactivatedUntil !== undefined) kiosk.deactivatedUntil = req.body.deactivatedUntil
		if (req.body.deactivated !== undefined) kiosk.deactivated = req.body.deactivated

		// Validate and save the updated document
		await kiosk.validate()
		await kiosk.save({ session })

		// Re-fetch the document *without* population here to pass to transform
		const updatedKiosk = await KioskModel.findById(kiosk._id).session(session).exec()

		if (!updatedKiosk) {
			await session.abortTransaction()
			throw new Error('Failed to re-fetch updated kiosk')
		}

		await session.commitTransaction()

		// Await the async transform function
		const transformedKiosk = await transformKiosk(updatedKiosk)
		res.status(200).json(transformedKiosk)

		emitKioskUpdated(transformedKiosk)
	} catch (error) {
		await session.abortTransaction()

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
	logger.silly('Creating new kioskTag')

	try {
		const kiosk = await KioskModel.findById(req.params.id)

		if (kiosk === null || kiosk === undefined) {
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		const kioskTag = await kiosk.generateNewKioskTag()

		res.status(200).json({ kioskTag })
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function deleteKiosk (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Deleting kiosk')

	if (req.body.confirm === undefined || req.body.confirm === null || typeof req.body.confirm !== 'boolean' || req.body.confirm !== true) {
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const kiosk = await KioskModel.findByIdAndDelete(req.params.id)

		if (kiosk === null || kiosk === undefined) {
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		res.status(204).send()

		emitKioskDeleted(kiosk.id as string)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
