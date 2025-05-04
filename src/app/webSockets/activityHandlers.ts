import { type IActivity } from '../models/Activity.js'
import { emitSocketEvent } from '../utils/socket.js'

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
