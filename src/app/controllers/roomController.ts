// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import RoomModel from '../models/Room.js'
import { emitRoomCreated, emitRoomDeleted, emitRoomUpdated } from '../webSockets/roomHandlers.js'

// Environment variables

// Config variables

// Destructuring and global variables

export async function createRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating room')

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		name: req.body.name,
		description: req.body.description
	}

	try {
		const newRoom = await RoomModel.create(allowedFields)
		res.status(201).json(newRoom)
		emitRoomCreated(newRoom)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting room')

	try {
		const room = await RoomModel.findById(req.params.id)

		if (room === null || room === undefined) {
			res.status(404).json({ error: 'Rum ikke fundet' })
			return
		}

		res.status(200).json(room)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getRooms (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting rooms')

	try {
		const rooms = await RoomModel.find({})
		res.status(200).json(rooms)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching room')

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		// Retrieve the existing room document
		const room = await RoomModel.findById(req.params.id).session(session)

		if (room === null || room === undefined) {
			res.status(404).json({ error: 'Rum ikke fundet' })
			return
		}

		// Manually set each field from allowed fields if it's present in the request body
		if (req.body.name !== undefined) room.name = req.body.name
		if (req.body.description !== undefined) room.description = req.body.description

		// Validate and save the updated document
		await room.validate()
		await room.save({ session })

		await session.commitTransaction()

		res.status(200).json(room)

		emitRoomUpdated(room)
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

export async function deleteRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Deleting room')

	if (req.body.confirm === undefined || req.body.confirm === null || typeof req.body.confirm !== 'boolean' || req.body.confirm !== true) {
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const room = await RoomModel.findByIdAndDelete(req.params.id)

		if (room === null || room === undefined) {
			res.status(404).json({ error: 'Rum ikke fundet' })
			return
		}

		res.status(204).send()

		emitRoomDeleted(room.id as string)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
