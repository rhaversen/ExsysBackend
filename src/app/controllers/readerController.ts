import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

import ReaderModel, { type IReader, type IReaderFrontend } from '../models/Reader.js'
import { pairReader, unpairReader } from '../services/apiServices.js'
import logger from '../utils/logger.js'

export function transformReader (
	readerDoc: IReader
): IReaderFrontend {
	// Transform the reader document to the frontend format
	return {
		_id: readerDoc.id,
		readerTag: readerDoc.readerTag,
		createdAt: readerDoc.createdAt,
		updatedAt: readerDoc.updatedAt
	}
}

export async function createReader (req: Request, res: Response, next: NextFunction): Promise<void> {
	// Destructure the pairingCode and readerTag from the request body
	const {
		pairingCode,
		readerTag
	} = req.body as Record<string, unknown>

	logger.info(`Attempting to create reader with tag: ${readerTag ?? 'N/A'}`)

	if (pairingCode === undefined || pairingCode === null || typeof pairingCode !== 'string') {
		logger.warn('Reader creation failed: Missing pairingCode')
		res.status(400).json({ error: 'Mangler pairingCode' })
		return
	}

	let apiReferenceId: string | undefined
	try {
		apiReferenceId = await pairReader(pairingCode)
		if (apiReferenceId === undefined) {
			logger.error('Reader creation failed: Pairing service returned undefined apiReferenceId')
			res.status(500).json({ error: 'Fejl ved parring af læser' })
			return
		}
		logger.debug(`Reader pairing successful. API Reference ID: ${apiReferenceId}`)
	} catch (error) {
		logger.error(`Reader creation failed: Error during pairing service call for pairing code ${pairingCode}`, { error })
		res.status(500).json({ error: 'Fejl ved parring af læser' })
		return
	}

	try {
		const newReader = await ReaderModel.create({
			apiReferenceId,
			readerTag
		})

		const transformedReader = transformReader(newReader)

		logger.info(`Reader created successfully: ID ${newReader.id}, Tag: ${newReader.readerTag ?? 'N/A'}`)

		res.status(201).json(transformedReader)
	} catch (error) {
		logger.error(`Reader creation failed: Error saving reader to database. Tag: ${readerTag ?? 'N/A'}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getReaders (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting all readers')

	try {
		const readers = await ReaderModel.find({})
		const transformedReaders = readers.map(transformReader)
		res.status(200).json(transformedReaders)
		logger.debug(`Retrieved ${readers.length} readers`)
	} catch (error) {
		logger.error('Failed to get readers', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchReader (req: Request, res: Response, next: NextFunction): Promise<void> {
	const readerId = req.params.id
	logger.info(`Attempting to patch reader: ID ${readerId}`)

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		const reader = await ReaderModel.findById(readerId).session(session)

		if (reader === null || reader === undefined) {
			logger.warn(`Patch reader failed: Reader not found. ID: ${readerId}`)
			res.status(404).json({ error: 'Læser ikke fundet' })
			await session.abortTransaction() // Abort transaction before returning
			await session.endSession()
			return
		}

		let updateApplied = false
		// Manually set each field from allowed fields if it's present in the request body
		if (req.body.readerTag !== undefined && reader.readerTag !== req.body.readerTag) {
			logger.debug(`Updating readerTag for ID ${readerId} from '${reader.readerTag ?? ''}' to '${req.body.readerTag}'`)
			reader.readerTag = req.body.readerTag
			updateApplied = true
		}

		if (!updateApplied) {
			logger.info(`Patch reader: No changes detected for reader ID ${readerId}`)
			res.status(200).json(transformReader(reader)) // Return current state if no changes
			await session.commitTransaction()
			await session.endSession()
			return
		}

		// Validate and save the updated document
		await reader.validate()
		await reader.save({ session })

		await session.commitTransaction()

		const transformedReader = transformReader(reader)

		logger.info(`Reader patched successfully: ID ${readerId}`)

		res.status(200).json(transformedReader)
	} catch (error) {
		await session.abortTransaction()
		logger.error(`Patch reader failed: Error updating reader ID ${readerId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	} finally {
		await session.endSession()
	}
}

export async function deleteReader (req: Request, res: Response, next: NextFunction): Promise<void> {
	const readerId = req.params.id
	logger.info(`Attempting to delete reader: ID ${readerId}`)

	if (req.body?.confirm !== true) {
		logger.warn(`Reader deletion failed: Confirmation not provided for ID ${readerId}`)
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	let reader: IReader | null = null
	try {
		reader = await ReaderModel.findById(readerId)

		if (reader === null || reader === undefined) {
			logger.warn(`Reader deletion failed: Reader not found. ID: ${readerId}`)
			res.status(404).json({ error: 'Læser ikke fundet' })
			return
		}

		logger.debug(`Attempting to unpair reader from external service. API Reference ID: ${reader.apiReferenceId}`)
		const readerUnpaired = await unpairReader(reader.apiReferenceId)

		if (!readerUnpaired) {
			logger.error(`Failed to unpair reader from external service, but proceeding with local deletion. Reader ID: ${readerId}, API Reference ID: ${reader.apiReferenceId}`)
			res.status(400).json({ error: 'Fejl ved fjernelse af læser' })
			return
		}

		logger.debug(`Reader unpaired successfully from external service. API Reference ID: ${reader.apiReferenceId}`)

		const deletedReader = await ReaderModel.findById(readerId)
		await deletedReader?.deleteOne()

		logger.info(`Reader deleted successfully: ID ${readerId}`)

		res.status(204).send()
	} catch (error) {
		logger.error(`Reader deletion failed: Error during deletion process for ID ${readerId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
