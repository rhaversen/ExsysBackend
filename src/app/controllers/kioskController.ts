// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import KioskModel, { type IKiosk } from '../models/Kiosk.js'
import { emitKioskCreated, emitKioskDeleted, emitKioskUpdated } from '../webSockets/kioskHandlers.js'

export async function createKiosk (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating kiosk')

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		name: req.body.name,
		kioskTag: req.body.kioskTag,
		readerId: req.body.readerId,
		password: req.body.password,
		activities: req.body.activities
	}

	try {
		const newKiosk = await (await (await KioskModel.create(allowedFields)).populate('activities')).populate('readerId')
		const transformedKiosk = {
			_id: newKiosk.id,
			name: newKiosk.name,
			readerId: newKiosk.readerId,
			kioskTag: newKiosk.kioskTag,
			activities: newKiosk.activities,
			createdAt: newKiosk.createdAt,
			updatedAt: newKiosk.updatedAt
		}
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
		const kiosk = req.user as IKiosk | undefined

		if (kiosk === null || kiosk === undefined) {
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		await (await kiosk.populate('activities')).populate('readerId')

		res.status(200).json({
			_id: kiosk._id,
			name: kiosk.name,
			readerId: kiosk.readerId,
			kioskTag: kiosk.kioskTag,
			activities: kiosk.activities,
			createdAt: kiosk.createdAt,
			updatedAt: kiosk.updatedAt
		})
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

		res.status(200).json({
			_id: kiosk._id,
			name: kiosk.name,
			kioskTag: kiosk.kioskTag,
			readerId: kiosk.readerId,
			activities: kiosk.activities,
			createdAt: kiosk.createdAt,
			updatedAt: kiosk.updatedAt
		})
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
			kiosks.map(kiosk => ({
				_id: kiosk._id,
				name: kiosk.name,
				readerId: kiosk.readerId,
				kioskTag: kiosk.kioskTag,
				activities: kiosk.activities,
				createdAt: kiosk.createdAt,
				updatedAt: kiosk.updatedAt
			}))
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
		if (req.body.password !== undefined) kiosk.password = req.body.password
		if (req.body.activities !== undefined) kiosk.activities = req.body.activities

		// Validate and save the updated document
		await kiosk.validate()
		await kiosk.save({ session })

		await (await kiosk.populate('activities')).populate('readerId')

		await session.commitTransaction()

		const transformedKiosk = {
			_id: kiosk.id,
			name: kiosk.name,
			readerId: kiosk.readerId,
			kioskTag: kiosk.kioskTag,
			activities: kiosk.activities,
			createdAt: kiosk.createdAt,
			updatedAt: kiosk.updatedAt
		}
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
