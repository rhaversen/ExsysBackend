import { IFeedbackFrontend } from '../models/Feedback'
import { emitSocketEvent } from '../utils/socket.js'

export function emitFeedbackCreated (feedback: IFeedbackFrontend): void {
	emitSocketEvent<IFeedbackFrontend>(
		'feedbackCreated',
		feedback,
		`Broadcasted feedback created for feedback ${feedback._id}`
	)
}

export function emitFeedbackUpdated (feedback: IFeedbackFrontend): void {
	emitSocketEvent<IFeedbackFrontend>(
		'feedbackUpdated',
		feedback,
		`Broadcasted feedback updated for feedback ${feedback._id}`
	)
}

export function emitFeedbackDeleted (feedbackId: string): void {
	emitSocketEvent<string>(
		'feedbackDeleted',
		feedbackId,
		`Broadcasted feedback deleted for feedback ${feedbackId}`
	)
}
