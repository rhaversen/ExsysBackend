// Node.js built-in modules

// Own modules
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import { type IActivity } from '../models/Activity.js'

// Third-party libraries

export function emitActivityPosted (activity: IActivity): void {
	const io = getSocket()

	try {
		io.emit('activityCreated', activity)

		logger.silly(`Broadcasted activity created for activity ${activity.id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitActivityUpdated (activity: IActivity): void {
	const io = getSocket()

	try {
		io.emit('activityUpdated', activity)

		logger.silly(`Broadcasted activity updated for activity ${activity.id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitActivityDeleted (activityId: string): void {
	const io = getSocket()

	try {
		io.emit('activityDeleted', activityId)

		logger.silly(`Broadcasted activity deleted for activity ${activityId}`)
	} catch (error) {
		logger.error(error)
	}
}
