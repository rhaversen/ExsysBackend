import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

import AdminModel, { type IAdmin, type IAdminFrontend } from '../models/Admin.js'
import logger from '../utils/logger.js'
import { emitAdminCreated, emitAdminDeleted, emitAdminUpdated } from '../webSockets/adminHandlers.js'

export function transformAdmin (
	adminDoc: IAdmin
): IAdminFrontend {
	return {
		_id: adminDoc.id,
		name: adminDoc.name,
		createdAt: adminDoc.createdAt,
		updatedAt: adminDoc.updatedAt
	}
}

export async function createAdmin (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating admin')

	// Destructuring fields from the request body
	const {
		password,
		name
	} = req.body as Record<string, unknown>

	try {
		// Creating a new admin with the password and name
		const newAdmin = await AdminModel.create({
			password,
			name
		})
		const transformedAdmin = transformAdmin(newAdmin)
		res.status(201).json(transformedAdmin)

		emitAdminCreated(transformedAdmin)
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
			admins.map((adminDoc) => transformAdmin(adminDoc))
		)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getMe (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting me admin')

	try {
		const admin = req.user as IAdmin | undefined

		if (admin === null || admin === undefined) {
			res.status(404).json({ error: 'Admin ikke fundet' })
			return
		}
		const transformedAdmin = transformAdmin(admin)
		res.status(200).json(transformedAdmin)
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
		if (req.body.name !== undefined) { admin.name = req.body.name }
		if (req.body.password !== undefined) { admin.password = req.body.password }

		// Validate and save the updated document
		await admin.validate()
		await admin.save({ session })

		await session.commitTransaction()

		const transformedAdmin = transformAdmin(admin)
		res.status(200).json(transformedAdmin)

		emitAdminUpdated(transformedAdmin)
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

	const user = req.user as IAdmin

	if (typeof req.body.confirm !== 'boolean' || req.body.confirm !== true) {
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	const adminCount = await AdminModel.countDocuments()
	if (adminCount === 1) {
		res.status(400).json({ error: 'Kan ikke slette den sidste admin' })
		return
	}

	if (user.id === req.params.id) {
		res.status(400).json({ error: 'Kan ikke slette sig selv' })
		return
	}

	try {
		const admin = await AdminModel.findByIdAndDelete(req.params.id)

		if (admin === null || admin === undefined) {
			res.status(404).json({ error: 'Admin ikke fundet' })
			return
		}

		res.status(204).send()

		emitAdminDeleted(admin.id as string)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
