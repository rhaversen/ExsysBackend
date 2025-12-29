import { type Document, model, Schema, Types } from 'mongoose'

import { transformFeedback } from '../controllers/feedbackController.js' // Import transformer
import logger from '../utils/logger.js'
import { emitFeedbackCreated, emitFeedbackDeleted, emitFeedbackUpdated } from '../webSockets/feedbackHandlers.js'

// Interfaces
export interface IFeedback extends Document {
	// Properties
	_id: Types.ObjectId
	feedback: string // The feedback text
	isRead: boolean // Indicates if the feedback has been isRead
	name?: string // Optional name of the person giving feedback

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Internal flag for middleware
	_wasNew?: boolean
}

export interface IFeedbackFrontend {
	_id: string
	name?: string // Optional name
	feedback: string // Required feedback text
	isRead: boolean // Whether the feedback has been read
	createdAt: Date
	updatedAt: Date
}

// Schema
const feedbackSchema = new Schema<IFeedback>({
	feedback: {
		type: Schema.Types.String,
		trim: true,
		required: [true, 'Feedback er påkrævet'],
		maxLength: [1000, 'Feedback kan højest være 1000 tegn']
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

// Validations

// Pre-save middleware
feedbackSchema.pre('save', function (next) {
	this._wasNew = this.isNew // Set _wasNew flag
	const logDetails: Record<string, unknown> = { feedback: this.feedback }
	if (this.name !== undefined) {
		logDetails.name = this.name
	}
	if (this.isNew) {
		logger.debug('Creating new feedback', logDetails)
	} else {
		logger.debug(`Updating feedback: ID ${this.id}`, logDetails)
	}
	next()
})

// Post-save middleware
feedbackSchema.post('save', function (doc: IFeedback, next) {
	const logDetails: Record<string, unknown> = { feedback: doc.feedback }
	if (doc.name !== undefined) {
		logDetails.name = doc.name
	}
	logger.debug(`Feedback saved successfully: ID ${doc.id}`, logDetails)

	try {
		const transformedFeedback = transformFeedback(doc)
		if (doc._wasNew ?? false) {
			emitFeedbackCreated(transformedFeedback)
		} else {
			emitFeedbackUpdated(transformedFeedback)
		}
	} catch (error) {
		logger.error(`Error emitting WebSocket event for Feedback ID ${doc.id} in post-save hook:`, { error })
	}
	if (doc._wasNew !== undefined) { delete doc._wasNew } // Clean up

	next()
})

// Pre-delete middleware
feedbackSchema.pre('deleteOne', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.info('Preparing to delete feedback with filter:', filter)

	try {
		// Find the document that WILL be deleted to get its ID and name
		const docToDelete = await FeedbackModel.findOne(filter).select('_id name feedback').lean()

		if (!docToDelete) {
			logger.warn('Pre-deleteOne hook (Feedback): No document matched the filter.')
			return next()
		}

		const docId = docToDelete._id
		const logDetails: Record<string, unknown> = { feedback: docToDelete.feedback }
		if (docToDelete.name !== undefined) {
			logDetails.name = docToDelete.name
		}
		logger.info(`Preparing to delete feedback: ID ${docId}`, logDetails)

		next()
	} catch (error) {
		logger.error('Error in pre-deleteOne hook for Feedback filter:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteOne hook failed'))
	}
})

// Pre-delete-many middleware
feedbackSchema.pre('deleteMany', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.warn('Executing deleteMany on Feedbacks with filter:', filter)

	try {
		const docsToDelete = await FeedbackModel.find(filter).select('_id name feedback').lean()
		const docIds = docsToDelete.map(doc => doc._id)
		const logDetails = docsToDelete.map(doc => ({ id: doc._id, name: doc.name, feedback: doc.feedback }))
		logger.info(`Preparing to delete multiple feedbacks: IDs ${docIds.join(', ')}`, { feedbacks: logDetails })
		next()
	} catch (error) {
		logger.error('Error in pre-deleteMany hook for Feedback filter:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteMany hook failed'))
	}
})

// Post-delete middleware
feedbackSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	const logDetails: Record<string, unknown> = { feedback: doc.feedback }
	if (doc.name !== undefined) {
		logDetails.name = doc.name
	}
	logger.info(`Feedback deleted successfully: ID ${doc.id}`, logDetails)
	try {
		emitFeedbackDeleted(doc.id) // Emit with ID
	} catch (error) {
		logger.error(`Error emitting WebSocket event for deleted Feedback ID ${doc.id} in post-delete hook:`, { error })
	}
	next()
})

feedbackSchema.post('deleteMany', function (result, next) {
	logger.info(`deleteMany on Feedback completed: ${result.deletedCount} documents deleted`)
	next()
})

// Compile the schema into a model
const FeedbackModel = model<IFeedback>('Feedback', feedbackSchema)

// Export the model
export default FeedbackModel
