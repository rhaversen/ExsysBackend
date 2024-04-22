// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import RoomModel from '../models/Room.js'

export async function createRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating room')

	try {
		const newRoom = await RoomModel.create(req.body as Record<string, unknown>)
		res.status(201).json(newRoom)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
