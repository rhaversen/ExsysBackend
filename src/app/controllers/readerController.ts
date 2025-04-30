// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import ReaderModel, { type IReader, type IReaderFrontend } from '../models/Reader.js'
import logger from '../utils/logger.js'
import { pairReader, unpairReader } from '../services/apiServices.js'
import { emitReaderCreated, emitReaderDeleted, emitReaderUpdated } from '../webSockets/readerHandlers.js'

// Environment variables

// Config variables

// Destructuring and global variables

export function transformReader (
	readerDoc: IReader
): IReaderFrontend {
	return {
		_id: readerDoc.id,
		readerTag: readerDoc.readerTag,
		createdAt: readerDoc.createdAt,
		updatedAt: readerDoc.updatedAt
	}
}

export async function createReader (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating reader')

	// Destructure the pairingCode and readerTag from the request body
	const {
		pairingCode,
		readerTag
	} = req.body as Record<string, unknown>

	if (pairingCode === undefined || pairingCode === null || typeof pairingCode !== 'string') {
		res.status(400).json({ error: 'Mangler pairingCode' })
		return
	}

	const apiReferenceId = await pairReader(pairingCode)

	if (apiReferenceId === undefined) {
		res.status(500).json({ error: 'Fejl ved parring af læser' })
		return
	}

	try {
		const newReader = await ReaderModel.create({
			apiReferenceId,
			readerTag
		})

		const transformedReader = transformReader(newReader)

		res.status(201).json(transformedReader)

		emitReaderCreated(transformedReader)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getReaders (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting readers')

	try {
		const readers = await ReaderModel.find({})
		res.status(200).json(readers)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchReader (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching reader')

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		// Retrieve the existing reader document
		const reader = await ReaderModel.findById(req.params.id).session(session)

		if (reader === null || reader === undefined) {
			res.status(404).json({ error: 'Læser ikke fundet' })
			return
		}

		// Manually set each field from allowed fields if it's present in the request body
		if (req.body.readerTag !== undefined) reader.readerTag = req.body.readerTag

		// Validate and save the updated document
		await reader.validate()
		await reader.save({ session })

		await session.commitTransaction()

		const transformedReader = transformReader(reader)

		res.status(200).json(transformedReader)

		emitReaderUpdated(transformedReader)
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

export async function deleteReader (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Deleting reader')

	if (req.body.confirm === undefined || req.body.confirm === null || typeof req.body.confirm !== 'boolean' || req.body.confirm !== true) {
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const reader = await ReaderModel.findById(req.params.id)

		if (reader === null || reader === undefined) {
			res.status(404).json({ error: 'Læser ikke fundet' })
			return
		}

		const readerUnpaired = await unpairReader(reader.apiReferenceId)

		if (!readerUnpaired) {
			res.status(400).json({ error: 'Fejl ved fjernelse af læser' })
			return
		}

		await ReaderModel.findByIdAndDelete(req.params.id)

		res.status(204).send()

		emitReaderDeleted(reader.id as string)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
