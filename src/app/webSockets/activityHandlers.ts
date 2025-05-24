import { IActivityFrontend } from '../models/Activity.js'
import { emitSocketEvent } from '../utils/socket.js'

export function emitActivityCreated (activity: IActivityFrontend): void {
	emitSocketEvent<IActivityFrontend>(
		'activityCreated',
		activity,
		`Broadcasted activity created for activity ${activity._id}`
	)
}

export function emitActivityUpdated (activity: IActivityFrontend): void {
	emitSocketEvent<IActivityFrontend>(
		'activityUpdated',
		activity,
		`Broadcasted activity updated for activity ${activity._id}`
	)
}

export function emitActivityDeleted (activityId: string): void {
	emitSocketEvent<string>(
		'activityDeleted',
		activityId,
		`Broadcasted activity deleted for activity ${activityId}`
	)
}
