// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import AdminModel from '../models/Admin.js'

export async function createAdmin (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating admin')

	// Destructuring fields from the request body
	const {
		password,
		name
	} = req.body as Record<string, unknown>

	try {
		// Creating a new admin with the password and name
		const newAdmin = await AdminModel.create({ password, name })
		res.status(201).json({
			_id: newAdmin._id,
			name: newAdmin.name
		})
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getAdmins (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting admins')

	try {
		const admins = await AdminModel.find({})
		res.status(200).json(
			admins.map(admin => ({
				_id: admin._id,
				name: admin.name
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

export async function patchAdmin (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching admin')

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		// Retrieve the admin document
		const admin = await AdminModel.findById(req.params.id).session(session)

		if (admin === null || admin === undefined) {
			res.status(404).json({ error: 'Admin ikke fundet' })
			return
		}

		// Apply changes if they exist
		if (req.body.name !== undefined) admin.name = req.body.name
		if (req.body.password !== undefined) admin.password = req.body.password

		// Validate and save the updated document
		await admin.validate()
		await admin.save({ session })

		await session.commitTransaction()

		res.status(200).json({
			_id: admin._id,
			name: admin.name
		})
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

export async function deleteAdmin (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Deleting admin')

	if (typeof req.body.confirm !== 'boolean' || req.body.confirm !== true) {
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const admin = await AdminModel.findByIdAndDelete(req.params.id)

		if (admin === null || admin === undefined) {
			res.status(404).json({ error: 'Admin ikke fundet' })
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
