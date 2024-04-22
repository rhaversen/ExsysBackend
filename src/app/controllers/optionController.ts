// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import OptionModel from '../models/Option'
import logger from '../utils/logger'

export async function createOption (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating option')

	try {
		const newOption = await OptionModel.create(req.body as Record<string, unknown>)
		res.status(201).json(newOption)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
