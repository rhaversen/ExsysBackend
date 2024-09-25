// Node.js built-in modules

// Own modules
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import { type TransformedSession } from '../utils/sessionUtils'

// Third-party libraries

export function emitSessionCreated (session: TransformedSession): void {
	const io = getSocket()

	try {
		io.emit('sessionCreated', session)

		logger.silly(`Broadcasted session created for session ${session._id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitSessionUpdated (session: TransformedSession): void {
	const io = getSocket()

	try {
		io.emit('sessionUpdated', session)

		logger.silly(`Broadcasted session updated for session ${session._id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitSessionDeleted (sessionId: string): void {
	const io = getSocket()

	try {
		io.emit('sessionDeleted', sessionId)

		logger.silly(`Broadcasted session deleted for session ${sessionId}`)
	} catch (error) {
		logger.error(error)
	}
}
