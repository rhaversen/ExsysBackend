import { IFeedbackMessageFrontend } from '../models/FeedbackMessage'
import { IFeedbackRatingFrontend } from '../models/FeedbackRating'
import { emitSocketEvent } from '../utils/socket.js'

export function emitFeedbackMessageCreated (message: IFeedbackMessageFrontend): void {
	emitSocketEvent<IFeedbackMessageFrontend>(
		'feedbackMessageCreated',
		message,
		`Broadcasted feedback message created: ${message._id}`
	)
}

export function emitFeedbackMessageUpdated (message: IFeedbackMessageFrontend): void {
	emitSocketEvent<IFeedbackMessageFrontend>(
		'feedbackMessageUpdated',
		message,
		`Broadcasted feedback message updated: ${message._id}`
	)
}

export function emitFeedbackMessageDeleted (messageId: string): void {
	emitSocketEvent<string>(
		'feedbackMessageDeleted',
		messageId,
		`Broadcasted feedback message deleted: ${messageId}`
	)
}

export function emitFeedbackRatingCreated (rating: IFeedbackRatingFrontend): void {
	emitSocketEvent<IFeedbackRatingFrontend>(
		'feedbackRatingCreated',
		rating,
		`Broadcasted feedback rating created: ${rating.rating} from kiosk ${rating.kioskId}`
	)
}

export function emitFeedbackRatingDeleted (ratingId: string): void {
	emitSocketEvent<string>(
		'feedbackRatingDeleted',
		ratingId,
		`Broadcasted feedback rating deleted: ${ratingId}`
	)
}
