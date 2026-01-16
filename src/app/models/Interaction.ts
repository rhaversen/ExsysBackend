import { type Document, model, Schema, Types } from 'mongoose'

import logger from '../utils/logger.js'

export interface InteractionMetadata {
	activityId?: string
	roomId?: string
	productId?: string
	optionId?: string
	orderId?: string
}

export interface IInteraction extends Document {
	_id: Types.ObjectId
	sessionId: string
	kioskId: Types.ObjectId
	type: string
	timestamp: Date
	metadata?: InteractionMetadata
	createdAt: Date
	updatedAt: Date
}

export interface IInteractionFrontend {
	_id: string
	sessionId: string
	kioskId: string
	type: string
	timestamp: string
	metadata?: InteractionMetadata
	createdAt: string
	updatedAt: string
}

const interactionSchema = new Schema<IInteraction>({
	sessionId: {
		type: Schema.Types.String,
		required: [true, 'Session ID er påkrævet'],
		trim: true,
		index: true
	},
	kioskId: {
		type: Schema.Types.ObjectId,
		ref: 'Kiosk',
		required: [true, 'Kiosk ID er påkrævet'],
		index: true
	},
	type: {
		type: Schema.Types.String,
		required: [true, 'Interaktionstype er påkrævet'],
		trim: true,
		index: true
	},
	timestamp: {
		type: Schema.Types.Date,
		required: [true, 'Tidsstempel er påkrævet'],
		index: true
	},
	metadata: {
		type: Schema.Types.Mixed,
		required: false
	}
}, {
	timestamps: true
})

interactionSchema.index({ sessionId: 1, timestamp: 1 })
interactionSchema.index({ kioskId: 1, timestamp: -1 })

interactionSchema.pre('save', function (next) {
	logger.debug(`Saving interaction: ${this.type} for session ${this.sessionId}`)
	next()
})

const InteractionModel = model<IInteraction>('Interaction', interactionSchema)

export default InteractionModel
