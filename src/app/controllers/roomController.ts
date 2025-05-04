import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

import RoomModel from '../models/Room.js'
import logger from '../utils/logger.js'
import { emitRoomCreated, emitRoomDeleted, emitRoomUpdated } from '../webSockets/roomHandlers.js'

export async function createRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	const roomName = req.body.name ?? 'N/A'
	logger.info(`Attempting to create room with name: ${roomName}`)

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		name: req.body.name,
		description: req.body.description
	}

	try {
		const newRoom = await RoomModel.create(allowedFields)
		logger.debug(`Room created successfully: ID ${newRoom.id}, Name: ${newRoom.name}`)
		res.status(201).json(newRoom)
		emitRoomCreated(newRoom)
	} catch (error) {
		logger.error(`Room creation failed for name: ${roomName}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	const roomId = req.params.id
	logger.debug(`Getting room: ID ${roomId}`)

	try {
		const room = await RoomModel.findById(roomId)

		if (room === null || room === undefined) {
			logger.warn(`Get room failed: Room not found. ID: ${roomId}`)
			res.status(404).json({ error: 'Rum ikke fundet' })
			return
		}

		logger.debug(`Retrieved room successfully: ID ${roomId}`)
		res.status(200).json(room)
	} catch (error) {
		logger.error(`Get room failed: Error retrieving room ID ${roomId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getRooms (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting all rooms')

	try {
		const rooms = await RoomModel.find({})
		logger.debug(`Retrieved ${rooms.length} rooms`)
		res.status(200).json(rooms)
	} catch (error) {
		logger.error('Failed to get rooms', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	const roomId = req.params.id
	logger.info(`Attempting to patch room: ID ${roomId}`)

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		// Retrieve the existing room document
		const room = await RoomModel.findById(roomId).session(session)

		if (room === null || room === undefined) {
			logger.warn(`Patch room failed: Room not found. ID: ${roomId}`)
			res.status(404).json({ error: 'Rum ikke fundet' })
			await session.abortTransaction() // Abort transaction before returning
			await session.endSession()
			return
		}

		let updateApplied = false
		// Manually set each field from allowed fields if it's present in the request body and changed
		if (req.body.name !== undefined && room.name !== req.body.name) {
			logger.debug(`Updating name for room ID ${roomId}`)
			room.name = req.body.name
			updateApplied = true
		}
		if (req.body.description !== undefined && room.description !== req.body.description) {
			logger.debug(`Updating description for room ID ${roomId}`)
			room.description = req.body.description
			updateApplied = true
		}

		if (!updateApplied) {
			logger.info(`Patch room: No changes detected for room ID ${roomId}`)
			res.status(200).json(room) // Return current state if no changes
			await session.commitTransaction()
			await session.endSession()
			return
		}

		// Validate and save the updated document
		await room.validate()
		await room.save({ session })

		await session.commitTransaction()
		logger.info(`Room patched successfully: ID ${roomId}`)
		res.status(200).json(room)

		emitRoomUpdated(room)
	} catch (error) {
		await session.abortTransaction()
		logger.error(`Patch room failed: Error updating room ID ${roomId}`, { error })
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
	const roomId = req.params.id
	logger.info(`Attempting to delete room: ID ${roomId}`)

	if (!mongoose.Types.ObjectId.isValid(roomId)) {
		logger.warn(`Delete room failed: Invalid Room ID format: ${roomId}`)
		res.status(400).json({ error: 'Invalid Room ID format' })
		return
	}
	if (req.body?.confirm !== true) {
		logger.warn(`Room deletion failed: Confirmation not provided for ID ${roomId}`)
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const room = await RoomModel.findByIdAndDelete(roomId)

		if (room === null || room === undefined) {
			logger.warn(`Room deletion failed: Room not found. ID: ${roomId}`)
			res.status(404).json({ error: 'Rum ikke fundet' })
			return
		}

		logger.info(`Room deleted successfully: ID ${roomId}, Name: ${room.name}`)
		res.status(204).send()

		emitRoomDeleted(roomId)
	} catch (error) {
		logger.error(`Room deletion failed: Error during deletion process for ID ${roomId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
