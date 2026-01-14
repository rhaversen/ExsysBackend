import { type Document, model, Schema, Types } from 'mongoose'

import { transformFeedbackRating } from '../controllers/feedbackController.js'
import logger from '../utils/logger.js'
import {
	emitFeedbackRatingCreated,
	emitFeedbackRatingDeleted
} from '../webSockets/feedbackHandlers.js'

export type FeedbackRatingValue = 'positive' | 'negative'

export interface IFeedbackRating extends Document {
	_id: Types.ObjectId
	kioskId: Types.ObjectId
	rating: FeedbackRatingValue

	createdAt: Date
	updatedAt: Date

	_wasNew?: boolean
}

export interface IFeedbackRatingFrontend {
	_id: string
	kioskId: string
	rating: FeedbackRatingValue
	createdAt: Date
	updatedAt: Date
}

const feedbackRatingSchema = new Schema<IFeedbackRating>({
	kioskId: {
		type: Schema.Types.ObjectId,
		ref: 'Kiosk',
		required: [true, 'Kiosk ID er påkrævet']
	},
	rating: {
		type: Schema.Types.String,
		enum: ['positive', 'negative'],
		required: [true, 'Vurdering er påkrævet']
	}
}, {
	timestamps: true
})

feedbackRatingSchema.pre('save', function (next) {
	this._wasNew = this.isNew
	logger.debug(`Saving feedback rating: ${this.rating} from kiosk ${this.kioskId.toString()}`)
	next()
})

feedbackRatingSchema.post('save', function () {
	const transformed = transformFeedbackRating(this)
	if (this._wasNew === true) {
		logger.info(`Feedback rating created: ${this.rating} from kiosk ${this.kioskId.toString()}`)
		emitFeedbackRatingCreated(transformed)
	}
})

feedbackRatingSchema.post('findOneAndDelete', function (doc: IFeedbackRating | null) {
	if (doc !== null) {
		logger.info(`Feedback rating deleted: ID ${doc._id.toString()}`)
		emitFeedbackRatingDeleted(doc._id.toString())
	}
})

// Compile the schema into a model
const FeedbackRatingModel = model<IFeedbackRating>('FeedbackRating', feedbackRatingSchema)

// Export the model
export default FeedbackRatingModel
