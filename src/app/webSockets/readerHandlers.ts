// Node.js built-in modules

// Own modules
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import { type IReaderFrontend } from '../models/Reader.js'

// Third-party libraries

export function emitReaderCreated (reader: IReaderFrontend): void {
	const io = getSocket()

	try {
		io.emit('readerCreated', reader)

		logger.silly(`Broadcasted reader created for reader ${reader._id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitReaderUpdated (reader: IReaderFrontend): void {
	const io = getSocket()

	try {
		io.emit('readerUpdated', reader)

		logger.silly(`Broadcasted reader updated for reader ${reader._id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitReaderDeleted (readerId: string): void {
	const io = getSocket()

	try {
		io.emit('readerDeleted', readerId)

		logger.silly(`Broadcasted reader deleted for reader ${readerId}`)
	} catch (error) {
		logger.error(error)
	}
}
