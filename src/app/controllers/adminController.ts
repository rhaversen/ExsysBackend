import { type NextFunction, type Request, type Response } from 'express'
import mongoose, { type FlattenMaps } from 'mongoose'

import AdminModel, { type IAdmin, type IAdminFrontend } from '../models/Admin.js'
import logger from '../utils/logger.js'

export function transformAdmin (
	adminDoc: IAdmin | FlattenMaps<IAdmin>
): IAdminFrontend {
	return {
		_id: adminDoc._id.toString(),
		name: adminDoc.name,
		createdAt: adminDoc.createdAt,
		updatedAt: adminDoc.updatedAt
	}
}

export async function createAdmin (req: Request, res: Response, next: NextFunction): Promise<void> {
	const adminName = req.body.name ?? 'N/A'
	logger.info(`Attempting to create admin with name: ${adminName}`)

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
		logger.debug(`Admin created successfully: ID ${newAdmin.id}, Name: ${newAdmin.name}`)
		res.status(201).json(transformedAdmin)
	} catch (error) {
		logger.error(`Admin creation failed for name: ${adminName}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getAdmins (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting all admins')

	try {
		const admins = await AdminModel.find({}).lean()
		const transformedAdmins = admins.map(transformAdmin)
		logger.debug(`Retrieved ${admins.length} admins`)
		res.status(200).json(transformedAdmins)
	} catch (error) {
		logger.error('Failed to get admins', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getMe (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting current admin user (me)')

	try {
		const admin = req.user as IAdmin | undefined

		if (admin === null || admin === undefined) {
			// This case should ideally not happen if ensureAuthenticated middleware is used correctly
			logger.error('Get me failed: req.user is undefined despite authentication check.')
			res.status(404).json({ error: 'Admin ikke fundet' })
			return
		}
		const transformedAdmin = transformAdmin(admin)
		logger.debug(`Retrieved current admin successfully: ID ${admin.id}, Name: ${admin.name}`)
		res.status(200).json(transformedAdmin)
	} catch (error) {
		logger.error('Get me failed: Unexpected error', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchAdmin (req: Request, res: Response, next: NextFunction): Promise<void> {
	const adminId = req.params.id
	logger.info(`Attempting to patch admin: ID ${adminId}`)

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		// Retrieve the admin document
		const admin = await AdminModel.findById(adminId).session(session)

		if (admin === null || admin === undefined) {
			logger.warn(`Patch admin failed: Admin not found. ID: ${adminId}`)
			res.status(404).json({ error: 'Admin ikke fundet' })
			await session.abortTransaction()
			await session.endSession()
			return
		}

		let updateApplied = false
		// Apply changes if they exist
		if (req.body.name !== undefined && admin.name !== req.body.name) {
			logger.debug(`Updating name for admin ID ${adminId}`)
			admin.name = req.body.name
			updateApplied = true
		}
		if (req.body.password !== undefined && req.body.password !== '') { // Don't update if password is empty string
			logger.debug(`Updating password for admin ID ${adminId}`)
			admin.password = req.body.password // Hashing is handled by pre-save hook
			updateApplied = true
		}

		if (!updateApplied) {
			logger.info(`Patch admin: No changes detected for admin ID ${adminId}`)
			res.status(200).json(transformAdmin(admin)) // Return current state if no changes
			await session.commitTransaction()
			await session.endSession()
			return
		}

		// Validate and save the updated document
		await admin.validate()
		await admin.save({ session })

		await session.commitTransaction()

		const transformedAdmin = transformAdmin(admin)
		logger.info(`Admin patched successfully: ID ${adminId}`)
		res.status(200).json(transformedAdmin)
	} catch (error) {
		await session.abortTransaction()
		logger.error(`Patch admin failed: Error updating admin ID ${adminId}`, { error })
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
	const adminIdToDelete = req.params.id
	const requestingAdmin = req.user as IAdmin
	logger.info(`Admin ID ${requestingAdmin.id} attempting to delete admin: ID ${adminIdToDelete}`)

	if (req.body?.confirm !== true) {
		logger.warn(`Admin deletion failed: Confirmation not provided for ID ${adminIdToDelete}`)
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	if (requestingAdmin.id === adminIdToDelete) {
		logger.warn(`Admin deletion failed: Admin ID ${requestingAdmin.id} attempted to delete self`)
		res.status(400).json({ error: 'Kan ikke slette sig selv' })
		return
	}

	try {
		const adminCount = await AdminModel.countDocuments()
		if (adminCount <= 1) {
			logger.warn(`Admin deletion failed: Attempted to delete the last admin. ID: ${adminIdToDelete}`)
			res.status(400).json({ error: 'Kan ikke slette den sidste admin' })
			return
		}

		const admin = await AdminModel.findById(adminIdToDelete)
		await admin?.deleteOne()

		if (admin === null || admin === undefined) {
			logger.warn(`Admin deletion failed: Admin not found. ID: ${adminIdToDelete}`)
			res.status(404).json({ error: 'Admin ikke fundet' })
			return
		}

		logger.info(`Admin deleted successfully: ID ${adminIdToDelete} by Admin ID ${requestingAdmin.id}`)
		res.status(204).send()
	} catch (error) {
		logger.error(`Admin deletion failed: Error during deletion process for ID ${adminIdToDelete}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
