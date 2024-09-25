// Node.js built-in modules

// Own modules
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import { type IRoom } from '../models/Room.js'

// Third-party libraries

export function emitRoomCreated (room: IRoom): void {
	const io = getSocket()

	try {
		io.emit('roomCreated', room)

		logger.silly(`Broadcasted room created for room ${room.id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitRoomUpdated (room: IRoom): void {
	const io = getSocket()

	try {
		io.emit('roomUpdated', room)

		logger.silly(`Broadcasted room updated for room ${room.id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitRoomDeleted (roomId: string): void {
	const io = getSocket()

	try {
		io.emit('roomDeleted', roomId)

		logger.silly(`Broadcasted room deleted for room ${roomId}`)
	} catch (error) {
		logger.error(error)
	}
}
