// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import KioskModel, { type IKiosk } from '../models/Kiosk.js'

export async function createKiosk (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating kiosk')

	const { password, confirmPassword } = req.body as Record<string, unknown>

	if (password !== confirmPassword) {
		res.status(400).json({ error: 'Password og confirmPassword skal være ens' })
		return
	}

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		name: req.body.name,
		kioskTag: req.body.kioskTag,
		password: req.body.password,
		activities: req.body.activities
	}

	try {
		const newKiosk = await KioskModel.create(allowedFields)
		res.status(201).json(newKiosk)
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

		res.status(200).json(kiosk)
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
		const kiosk = await KioskModel.findById(req.params.id)

		if (kiosk === null || kiosk === undefined) {
			res.status(404).json({ error: 'Kiosk ikke fundet' })
			return
		}

		res.status(200).json(kiosk)
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
		const kiosks = await KioskModel.find({})
		res.status(200).json(kiosks)
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

	const { password, confirmPassword } = req.body as Record<string, unknown>

	if (password !== undefined) {
		if (confirmPassword === undefined) {
			res.status(400).json({ error: 'Bekræft password mangler' })
			return
		} else if (password !== confirmPassword) {
			res.status(400).json({ error: 'Password og confirmPassword skal være ens' })
			return
		}
	}

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
		if (req.body.password !== undefined) kiosk.password = req.body.password
		if (req.body.activities !== undefined) kiosk.activities = req.body.activities

		// Validate and save the updated document
		await kiosk.validate()
		await kiosk.save({ session })

		await session.commitTransaction()
		res.status(200).json(kiosk)
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
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
