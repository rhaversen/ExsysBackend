import { type Document, model, Schema, Types } from 'mongoose'

import { transformFeedbackMessage } from '../controllers/feedbackController.js'
import logger from '../utils/logger.js'
import {
	emitFeedbackMessageCreated,
	emitFeedbackMessageDeleted,
	emitFeedbackMessageUpdated
} from '../webSockets/feedbackHandlers.js'

export interface IFeedbackMessage extends Document {
	_id: Types.ObjectId
	message: string
	isRead: boolean
	name?: string

	createdAt: Date
	updatedAt: Date

	_wasNew?: boolean
}

export interface IFeedbackMessageFrontend {
	_id: string
	name?: string
	message: string
	isRead: boolean
	createdAt: Date
	updatedAt: Date
}

const feedbackMessageSchema = new Schema<IFeedbackMessage>({
	message: {
		type: Schema.Types.String,
		trim: true,
		required: [true, 'Besked er påkrævet'],
		maxLength: [1000, 'Besked kan højest være 1000 tegn']
	},
	isRead: {
		type: Schema.Types.Boolean,
		default: false
	},
	name: {
		type: Schema.Types.String,
		trim: true,
		maxLength: [100, 'Navn kan højest være 100 tegn']
	}
}, {
	timestamps: true
})

feedbackMessageSchema.pre('save', function (next) {
	this._wasNew = this.isNew
	const logDetails: Record<string, unknown> = { message: this.message }
	if (this.name !== undefined) {
		logDetails.name = this.name
	}
	if (this.isNew) {
		logger.debug('Creating new feedback message', logDetails)
	} else {
		logger.debug(`Updating feedback message: ID ${this.id}`, logDetails)
	}
	next()
})

feedbackMessageSchema.post('save', function (doc: IFeedbackMessage, next) {
	const logDetails: Record<string, unknown> = { message: doc.message }
	if (doc.name !== undefined) {
		logDetails.name = doc.name
	}
	logger.debug(`Feedback message saved successfully: ID ${doc.id}`, logDetails)

	try {
		const transformed = transformFeedbackMessage(doc)
		if (doc._wasNew ?? false) {
			emitFeedbackMessageCreated(transformed)
		} else {
			emitFeedbackMessageUpdated(transformed)
		}
	} catch (error) {
		logger.error(`Error emitting WebSocket event for FeedbackMessage ID ${doc.id}:`, { error })
	}
	if (doc._wasNew !== undefined) { delete doc._wasNew }

	next()
})

feedbackMessageSchema.pre('deleteOne', async function (next) {
	const filter = this.getFilter()
	logger.info('Preparing to delete feedback message with filter:', filter)

	try {
		const docToDelete = await FeedbackMessageModel.findOne(filter).select('_id name message').lean()

		if (!docToDelete) {
			logger.warn('Pre-deleteOne hook (FeedbackMessage): No document matched the filter.')
			return next()
		}

		const logDetails: Record<string, unknown> = { message: docToDelete.message }
		if (docToDelete.name !== undefined) {
			logDetails.name = docToDelete.name
		}
		logger.info(`Preparing to delete feedback message: ID ${docToDelete._id}`, logDetails)

		next()
	} catch (error) {
		logger.error('Error in pre-deleteOne hook for FeedbackMessage:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteOne hook failed'))
	}
})

feedbackMessageSchema.pre('deleteMany', async function (next) {
	const filter = this.getFilter()
	logger.warn('Executing deleteMany on FeedbackMessages with filter:', filter)

	try {
		const docsToDelete = await FeedbackMessageModel.find(filter).select('_id name message').lean()
		const docIds = docsToDelete.map(doc => doc._id)
		logger.info(`Preparing to delete multiple feedback messages: IDs ${docIds.join(', ')}`)
		next()
	} catch (error) {
		logger.error('Error in pre-deleteMany hook for FeedbackMessage:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteMany hook failed'))
	}
})

feedbackMessageSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	const logDetails: Record<string, unknown> = { message: doc.message }
	if (doc.name !== undefined) {
		logDetails.name = doc.name
	}
	logger.info(`Feedback message deleted successfully: ID ${doc.id}`, logDetails)
	try {
		emitFeedbackMessageDeleted(doc.id)
	} catch (error) {
		logger.error(`Error emitting WebSocket event for deleted FeedbackMessage ID ${doc.id}:`, { error })
	}
	next()
})

feedbackMessageSchema.post('deleteMany', function (result, next) {
	logger.info(`deleteMany on FeedbackMessage completed: ${result.deletedCount} documents deleted`)
	next()
})

// Compile the schema into a model
const FeedbackMessageModel = model<IFeedbackMessage>('FeedbackMessage', feedbackMessageSchema)

// Export the model
export default FeedbackMessageModel
