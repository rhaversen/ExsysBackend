// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import ConfigsModel from '../models/Configs.js'

// Environment variables

// Config variables

// Destructuring and global variables

async function getOrCreateConfigs(session?: mongoose.ClientSession) {
	const configs = await ConfigsModel.findOne().session(session ?? null)
	if (configs === null || configs === undefined) {
		const newConfigs = await ConfigsModel.create({}, { session: session ?? null }).then(docs => docs[0])
		return newConfigs
	}
	return configs
}

export async function getConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting configs')

	try {
		const configs = await getOrCreateConfigs()

		res.status(200).json(configs)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching configs')

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		const configs = await getOrCreateConfigs(session)

		// Set fields directly, checking for undefined to ensure not overwriting with undefined
		if (req.body.kioskInactivityTimeoutMs !== undefined) configs.kioskInactivityTimeoutMs = req.body.kioskInactivityTimeoutMs
		if (req.body.kioskInactivityTimeoutWarningMs !== undefined) configs.kioskInactivityTimeoutWarningMs = req.body.kioskInactivityTimeoutWarningMs
		if (req.body.kioskOrderConfirmationTimeoutMs !== undefined) configs.kioskOrderConfirmationTimeoutMs = req.body.kioskOrderConfirmationTimeoutMs

		// Validate and save the updated document
		await configs.validate()
		const savedConfigs = await configs.save({ session })

		await session.commitTransaction()

		res.status(200).json(savedConfigs)
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
