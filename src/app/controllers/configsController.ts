import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

import ConfigsModel, { type IConfigs, type IConfigsFrontend } from '../models/Configs.js'
import logger from '../utils/logger.js'
import { emitConfigsUpdated } from '../webSockets/configsHandlers.js'

export function transformConfigs (
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

export async function getOrCreateConfigs (): Promise<IConfigs> {
	logger.debug('Attempting to find existing configs document')
	let configs = await ConfigsModel.findOne()
	if (configs === null || configs === undefined) {
		logger.info('No configs document found, creating a new one with defaults.')
		try {
			configs = await ConfigsModel.create({})
			logger.debug(`New configs document created successfully: ID ${configs.id}`)
		} catch (error) {
			logger.error('Failed to create initial configs document', { error })
			throw error // Re-throw error to be handled by caller
		}
	} else {
		logger.debug(`Found existing configs document: ID ${configs.id}`)
	}
	return configs
}

export async function getConfigs (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting application configs')

	try {
		const configs = await getOrCreateConfigs()
		const transformedConfigs = transformConfigs(configs)
		logger.debug('Retrieved and transformed configs successfully')
		res.status(200).json(transformedConfigs)
	} catch (error) {
		logger.error('Failed to get configs', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchConfigs (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.info('Attempting to patch application configs')

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		const configs = await getOrCreateConfigs()
		logger.debug(`Patching configs document: ID ${configs.id}`)

		let updateApplied = false
		// Set fields directly, checking for undefined and change
		if (req.body.kioskInactivityTimeoutMs !== undefined && configs.kioskInactivityTimeoutMs !== req.body.kioskInactivityTimeoutMs) {
			logger.debug(`Updating kioskInactivityTimeoutMs for configs ID ${configs.id}`)
			configs.kioskInactivityTimeoutMs = req.body.kioskInactivityTimeoutMs
			updateApplied = true
		}
		if (req.body.kioskInactivityTimeoutWarningMs !== undefined && configs.kioskInactivityTimeoutWarningMs !== req.body.kioskInactivityTimeoutWarningMs) {
			logger.debug(`Updating kioskInactivityTimeoutWarningMs for configs ID ${configs.id}`)
			configs.kioskInactivityTimeoutWarningMs = req.body.kioskInactivityTimeoutWarningMs
			updateApplied = true
		}
		if (req.body.kioskOrderConfirmationTimeoutMs !== undefined && configs.kioskOrderConfirmationTimeoutMs !== req.body.kioskOrderConfirmationTimeoutMs) {
			logger.debug(`Updating kioskOrderConfirmationTimeoutMs for configs ID ${configs.id}`)
			configs.kioskOrderConfirmationTimeoutMs = req.body.kioskOrderConfirmationTimeoutMs
			updateApplied = true
		}
		if (req.body.disabledWeekdays !== undefined) {
			logger.debug(`Updating disabledWeekdays for configs ID ${configs.id}`)
			configs.disabledWeekdays = req.body.disabledWeekdays
			updateApplied = true
		}
		if (req.body.kioskPassword !== undefined && req.body.kioskPassword !== '') { // Don't update if password is empty string
			logger.debug(`Updating kioskPassword for configs ID ${configs.id}`)
			configs.kioskPassword = req.body.kioskPassword
			updateApplied = true
		}

		if (!updateApplied) {
			logger.info(`Patch configs: No changes detected for configs ID ${configs.id}`)
			res.status(200).json(transformConfigs(configs)) // Return current state if no changes
			await session.commitTransaction()
			await session.endSession()
			return
		}

		// Validate and save the updated document
		await configs.validate()
		const savedConfigs = await configs.save({ session })

		await session.commitTransaction()

		const transformedConfigs = transformConfigs(savedConfigs)
		logger.info(`Configs patched successfully: ID ${configs.id}`)
		res.status(200).json(transformedConfigs)

		emitConfigsUpdated(transformedConfigs)
	} catch (error) {
		await session.abortTransaction()
		logger.error('Patch configs failed', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	} finally {
		await session.endSession()
	}
}
