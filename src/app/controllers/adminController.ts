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
			res.status(400).json({ error: 'Kodeord og bekræftkodeord er ikke ens' })
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
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
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
				res.status(400).json({ error: 'Kodeord og bekræftkodeord er ikke ens' })
				return
			}
		}

		const admin = await AdminModel.findByIdAndUpdate(req.params.id, req.body as Record<string, unknown>, { new: true })

		if (admin === null || admin === undefined) {
			res.status(404).json({ error: 'Admin ikke fundet' })
			return
		}

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
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
