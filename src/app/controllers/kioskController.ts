// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import KioskModel, { type IKiosk } from '../models/Kiosk.js'
import { emitKioskCreated, emitKioskDeleted, emitKioskUpdated } from '../webSockets/kioskHandlers.js'

// Environment variables

// Config variables

// Destructuring and global variables

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
		const newKiosk = await (await (await KioskModel.create(allowedFields)).populate('activities')).populate('readerId')
		const transformedKiosk = transformKiosk(newKiosk)
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

const transformKiosk = (kiosk: IKiosk) => ({
	_id: kiosk.id,
	name: kiosk.name,
	readerId: kiosk.readerId,
	kioskTag: kiosk.kioskTag,
	activities: kiosk.activities,
	disabledActivities: kiosk.disabledActivities,
	deactivated: kiosk.deactivated,
	deactivatedUntil: kiosk.deactivatedUntil,
	createdAt: kiosk.createdAt,
	updatedAt: kiosk.updatedAt
})

export async function getMe (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting me kiosk')

	try {
		const kiosk = req.user as IKiosk | undefined

		if (kiosk === null || kiosk === undefined) {
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		await (await kiosk.populate('activities')).populate('readerId')

		res.status(200).json(transformKiosk(kiosk))
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
		const kiosk = await KioskModel.findById(req.params.id).populate('activities').populate('readerId')

		if (kiosk === null || kiosk === undefined) {
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		res.status(200).json(transformKiosk(kiosk))
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
		const kiosks = await KioskModel.find({}).populate('activities').populate('readerId')
		res.status(200).json(
			kiosks.map(kiosk => transformKiosk(kiosk))
		)
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

		await (await kiosk.populate('activities')).populate('readerId')

		await session.commitTransaction()

		const transformedKiosk = transformKiosk(kiosk)
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
