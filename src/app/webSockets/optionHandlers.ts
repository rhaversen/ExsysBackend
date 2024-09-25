// Node.js built-in modules

// Own modules
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import { type IOption } from '../models/Option.js'

// Third-party libraries

export function emitOptionCreated (option: IOption): void {
	const io = getSocket()

	try {
		io.emit('optionCreated', option)

		logger.silly(`Broadcasted option created for option ${option.id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitOptionUpdated (option: IOption): void {
	const io = getSocket()

	try {
		io.emit('optionUpdated', option)

		logger.silly(`Broadcasted option updated for option ${option.id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitOptionDeleted (optionId: string): void {
	const io = getSocket()

	try {
		io.emit('optionDeleted', optionId)

		logger.silly(`Broadcasted option deleted for option ${optionId}`)
	} catch (error) {
		logger.error(error)
	}
}
