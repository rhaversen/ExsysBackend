// Node.js built-in modules

// Own modules
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import { type IAdminFrontend } from '../models/Admin.js'

// Third-party libraries

export function emitAdminCreated (admin: IAdminFrontend): void {
	const io = getSocket()

	try {
		io.emit('adminCreated', admin)

		logger.silly(`Broadcasted admin created for admin ${admin._id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitAdminUpdated (admin: IAdminFrontend): void {
	const io = getSocket()

	try {
		io.emit('adminUpdated', admin)

		logger.silly(`Broadcasted admin updated for admin ${admin._id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitAdminDeleted (adminId: string): void {
	const io = getSocket()

	try {
		io.emit('adminDeleted', adminId)

		logger.silly(`Broadcasted admin deleted for admin ${adminId}`)
	} catch (error) {
		logger.error(error)
	}
}
