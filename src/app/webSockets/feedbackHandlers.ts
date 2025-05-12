import { type IFeedback } from '../models/Feedback'
import { emitSocketEvent } from '../utils/socket.js'

export function emitFeedbackCreated (feedback: IFeedback): void {
	emitSocketEvent<IFeedback>(
		'feedbackCreated',
		feedback,
		`Broadcasted feedback created for feedback ${feedback._id}`
	)
}

export function emitFeedbackUpdated (feedback: IFeedback): void {
	emitSocketEvent<IFeedback>(
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
