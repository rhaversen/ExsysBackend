// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import OptionModel from '../models/Option.js'
import logger from '../utils/logger.js'

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

export async function getOptions (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting options')

	try {
		const options = await OptionModel.find({})
		res.status(200).json(options)
	} catch (error) {
		next(error)
	}
}

export async function patchOption (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching option')

	try {
		const option = await OptionModel.findByIdAndUpdate(req.params.id, req.body as Record<string, unknown>, { new: true })
		res.json(option)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function deleteOption (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Deleting option')

	if (typeof req.body.confirm !== 'boolean' || req.body.confirm !== true) {
		res.status(400).json({ error: 'You must confirm the deletion' })
		return
	}

	try {
		await OptionModel.findByIdAndDelete(req.params.id)
		res.status(204).send()
	} catch (error) {
		next(error)
	}
}
