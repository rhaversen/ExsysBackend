// Node.js built-in modules

// Own modules
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import { type IKioskFrontend } from '../models/Kiosk.js'

// Third-party libraries

export function emitKioskCreated (kiosk: IKioskFrontend): void {
	const io = getSocket()

	try {
		io.emit('kioskCreated', kiosk)

		logger.silly(`Broadcasted kiosk created for kiosk ${kiosk._id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitKioskUpdated (kiosk: IKioskFrontend): void {
	const io = getSocket()

	try {
		io.emit('kioskUpdated', kiosk)

		logger.silly(`Broadcasted kiosk updated for kiosk ${kiosk._id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitKioskDeleted (kioskId: string): void {
	const io = getSocket()

	try {
		io.emit('kioskDeleted', kioskId)

		logger.silly(`Broadcasted kiosk deleted for kiosk ${kioskId}`)
	} catch (error) {
		logger.error(error)
	}
}
