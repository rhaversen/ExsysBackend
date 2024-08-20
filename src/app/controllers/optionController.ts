// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import OptionModel from '../models/Option.js'
import logger from '../utils/logger.js'

export async function createOption (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating option')

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		name: req.body.name,
		imageURL: req.body.imageURL,
		price: req.body.price
	}

	try {
		const newOption = await OptionModel.create(allowedFields)
		res.status(201).json(newOption)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
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
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchOption (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching option')

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		// Retrieve the existing option document
		const option = await OptionModel.findById(req.params.id).session(session)

		if (option === null || option === undefined) {
			res.status(404).json({ error: 'Tilvalg ikke fundet' })
			return
		}

		// Manually set each field from allowed fields if it's present in the request body
		if (req.body.name !== undefined) option.name = req.body.name
		if (req.body.imageURL !== undefined) option.imageURL = req.body.imageURL
		if (req.body.price !== undefined) option.price = req.body.price

		// Validate and save the updated document
		await option.validate()
		await option.save({ session })

		await session.commitTransaction()

		res.json(option) // Ensure response only includes appropriate data
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

export async function deleteOption (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Deleting option')

	if (req.body.confirm === undefined || req.body.confirm === null || typeof req.body.confirm !== 'boolean' || req.body.confirm !== true) {
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const option = await OptionModel.findByIdAndDelete(req.params.id)

		if (option === null || option === undefined) {
			res.status(404).json({ error: 'Tilvalg ikke fundet' })
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
