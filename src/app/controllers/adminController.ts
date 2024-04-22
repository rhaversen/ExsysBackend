// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import AdminModel from '../models/Admin.js'

export async function createAdmin (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating admin')

	try {
		// Destructuring passwords and the remaining fields
		const {
			password,
			confirmPassword,
			...rest
		} = req.body as Record<string, unknown>

		if (password !== confirmPassword) {
			res.status(400).json({ error: 'Passwords do not match' })
			return
		}

		// Creating a new admin with the password and the remaining fields
		const newAdmin = await AdminModel.create({ password, ...rest })
		res.status(201).json(newAdmin)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
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
		res.status(200).json(admins)
	} catch (error) {
		next(error)
	}
}

export async function patchAdmin (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching admin')

	try {
		const {
			password,
			confirmPassword
		} = req.body

		if (password !== undefined && confirmPassword !== undefined) {
			if (password !== confirmPassword) {
				res.status(400).json({ error: 'Passwords do not match' })
				return
			}
		}

		const admin = await AdminModel.findByIdAndUpdate(req.params.id, req.body as Record<string, unknown>, { new: true })
		res.status(200).json(admin)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function deleteAdmin (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Deleting admin')

	if (typeof req.body.confirm !== 'boolean' || req.body.confirm !== true) {
		res.status(400).json({ error: 'You must confirm the deletion' })
		return
	}

	try {
		await AdminModel.findByIdAndDelete(req.params.id)
		res.status(204).send()
	} catch (error) {
		next(error)
	}
}
