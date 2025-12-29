import { type NextFunction, type Request, type Response } from 'express'
import mongoose, { type FlattenMaps } from 'mongoose'

import OptionModel, { IOption, IOptionFrontend } from '../models/Option.js'
import logger from '../utils/logger.js'

export const transformOption = (
	optionDoc: IOption | FlattenMaps<IOption>
): IOptionFrontend => {
	return {
		_id: optionDoc._id.toString(),
		name: optionDoc.name,
		imageURL: optionDoc.imageURL,
		price: optionDoc.price,
		createdAt: optionDoc.createdAt,
		updatedAt: optionDoc.updatedAt
	}
}

export async function createOption (req: Request, res: Response, next: NextFunction): Promise<void> {
	const optionName = req.body.name ?? 'N/A'
	logger.info(`Attempting to create option with name: ${optionName}`)

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		name: req.body.name,
		imageURL: req.body.imageURL,
		price: req.body.price
	}

	try {
		const newOption = await OptionModel.create(allowedFields)
		logger.debug(`Option created successfully: ID ${newOption.id}, Name: ${newOption.name}`)
		res.status(201).json(transformOption(newOption))
	} catch (error) {
		logger.error(`Option creation failed for name: ${optionName}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getOptions (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting all options')

	try {
		const options = await OptionModel.find({}).lean()
		logger.debug(`Retrieved ${options.length} options`)
		res.status(200).json(options.map(transformOption))
	} catch (error) {
		logger.error('Failed to get options', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchOption (req: Request, res: Response, next: NextFunction): Promise<void> {
	const optionId = req.params.id
	logger.info(`Attempting to patch option: ID ${optionId}`)

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		// Retrieve the existing option document
		const option = await OptionModel.findById(optionId).session(session)

		if (option === null || option === undefined) {
			logger.warn(`Patch option failed: Option not found. ID: ${optionId}`)
			res.status(404).json({ error: 'Tilvalg ikke fundet' })
			await session.abortTransaction() // Abort transaction before returning
			await session.endSession()
			return
		}

		let updateApplied = false
		// Manually set each field from allowed fields if it's present in the request body
		if (req.body.name !== undefined && option.name !== req.body.name) {
			logger.debug(`Updating name for option ID ${optionId}`)
			option.name = req.body.name
			updateApplied = true
		}
		if (req.body.imageURL !== undefined && option.imageURL !== req.body.imageURL) {
			logger.debug(`Updating imageURL for option ID ${optionId}`)
			option.imageURL = req.body.imageURL
			updateApplied = true
		}
		if (req.body.price !== undefined && option.price !== req.body.price) {
			logger.debug(`Updating price for option ID ${optionId}`)
			option.price = req.body.price
			updateApplied = true
		}

		if (!updateApplied) {
			logger.info(`Patch option: No changes detected for option ID ${optionId}`)
			res.status(200).json(transformOption(option)) // Return current state if no changes
			await session.commitTransaction()
			await session.endSession()
			return
		}

		// Validate and save the updated document
		await option.validate()
		await option.save({ session })

		await session.commitTransaction()
		logger.info(`Option patched successfully: ID ${optionId}`)
		res.json(transformOption(option))
	} catch (error) {
		await session.abortTransaction()
		logger.error(`Patch option failed: Error updating option ID ${optionId}`, { error })
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
	const optionId = req.params.id
	logger.info(`Attempting to delete option: ID ${optionId}`)

	if (req.body?.confirm !== true) {
		logger.warn(`Option deletion failed: Confirmation not provided for ID ${optionId}`)
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const option = await OptionModel.findById(optionId)
		await option?.deleteOne()

		if (option === null || option === undefined) {
			logger.warn(`Option deletion failed: Option not found. ID: ${optionId}`)
			res.status(404).json({ error: 'Tilvalg ikke fundet' })
			return
		}

		logger.info(`Option deleted successfully: ID ${optionId}, Name: ${option.name}`)
		res.status(204).send()
	} catch (error) {
		logger.error(`Option deletion failed: Error during deletion process for ID ${optionId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
