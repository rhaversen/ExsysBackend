// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import ConfigsModel, { type IConfigs, type IConfigsFrontend } from '../models/Configs.js'
import { emitConfigsUpdated } from '../webSockets/configsHandlers.js'

// Environment variables

// Config variables

// Destructuring and global variables

export function transformConfigs(
	configsDoc: IConfigs
): IConfigsFrontend {
	return {
		_id: configsDoc.id,
		configs: {
			kioskInactivityTimeoutMs: configsDoc.kioskInactivityTimeoutMs,
			kioskInactivityTimeoutWarningMs: configsDoc.kioskInactivityTimeoutWarningMs,
			kioskOrderConfirmationTimeoutMs: configsDoc.kioskOrderConfirmationTimeoutMs,
			disabledWeekdays: configsDoc.disabledWeekdays,
			kioskPassword: configsDoc.kioskPassword
		},
		createdAt: configsDoc.createdAt,
		updatedAt: configsDoc.updatedAt
	}
}

export async function getOrCreateConfigs(): Promise<IConfigs> {
	const configs = await ConfigsModel.findOne()
	if (configs === null || configs === undefined) {
		const newConfigs = await ConfigsModel.create({})
		return newConfigs
	}
	return configs
}

export async function getConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting configs')

	try {
		const configs = await getOrCreateConfigs()

		const transformedConfigs = transformConfigs(configs)

		res.status(200).json(transformedConfigs)
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
		const configs = await getOrCreateConfigs()

		// Set fields directly, checking for undefined to ensure not overwriting with undefined
		if (req.body.kioskInactivityTimeoutMs !== undefined) configs.kioskInactivityTimeoutMs = req.body.kioskInactivityTimeoutMs
		if (req.body.kioskInactivityTimeoutWarningMs !== undefined) configs.kioskInactivityTimeoutWarningMs = req.body.kioskInactivityTimeoutWarningMs
		if (req.body.kioskOrderConfirmationTimeoutMs !== undefined) configs.kioskOrderConfirmationTimeoutMs = req.body.kioskOrderConfirmationTimeoutMs
		if (req.body.disabledWeekdays !== undefined) configs.disabledWeekdays = req.body.disabledWeekdays
		if (req.body.kioskPassword !== undefined) configs.kioskPassword = req.body.kioskPassword

		// Validate and save the updated document
		await configs.validate()
		const savedConfigs = await configs.save({ session })

		await session.commitTransaction()

		const transformedConfigs = transformConfigs(savedConfigs)

		res.status(200).json(transformedConfigs)

		emitConfigsUpdated(transformedConfigs)
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
