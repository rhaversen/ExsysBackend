// Node.js built-in modules

// Third-party libraries

// Own modules
import { emitSocketEvent } from '../utils/socket.js'
import { type IActivity } from '../models/Activity.js'

// Environment variables

// Config variables

// Destructuring and global variables

export function emitActivityPosted (activity: IActivity): void {
	emitSocketEvent<IActivity>(
		'activityCreated',
		activity,
		`Broadcasted activity created for activity ${activity.id}`
	)
}

export function emitActivityUpdated (activity: IActivity): void {
	emitSocketEvent<IActivity>(
		'activityUpdated',
		activity,
		`Broadcasted activity updated for activity ${activity.id}`
	)
}

export function emitActivityDeleted (activityId: string): void {
	emitSocketEvent<string>(
		'activityDeleted',
		activityId,
		`Broadcasted activity deleted for activity ${activityId}`
	)
}
