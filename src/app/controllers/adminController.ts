// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import AdminModel from '../models/Admin.js'

export async function createAdmin (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating room')

	try {
		// Destructuring passwords and the remaining fields
		const { password, confirmPassword, ...rest } = req.body as Record<string, unknown>

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
