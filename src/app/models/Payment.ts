import { type Document, model, Schema } from 'mongoose'

import logger from '../utils/logger.js'

// Interfaces
export interface IPayment extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	clientTransactionId?: string // SumUp uses this to send back OUR Payment._id
	paymentStatus: 'pending' | 'successful' | 'failed'

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Methods
}

// Schema
const paymentSchema = new Schema<IPayment>({
	clientTransactionId: {
		type: String,
		index: true // Index for faster lookup from callback
	},
	paymentStatus: {
		type: String,
		enum: ['pending', 'successful', 'failed'],
		required: true, // Make status required
		default: 'pending'
	}
}, {
	timestamps: true
})

// Pre-save middleware
paymentSchema.pre('save', async function (next) {
	// Log status changes
	if (this.isNew) {
		logger.info(`Creating new payment: Status "${this.paymentStatus}", ClientTxID (if SumUp): ${this.clientTransactionId ?? 'N/A'}`)
	} else if (this.isModified('paymentStatus')) {
		logger.info(`Updating payment status: ID ${this.id}, New Status "${this.paymentStatus}"`)
	} else {
		logger.debug(`Updating payment: ID ${this.id} (Status not changed)`)
	}
	next()
})

// Post-save middleware
paymentSchema.post('save', function (doc, next) {
	logger.debug(`Payment saved successfully: ID ${doc.id}, Status "${doc.paymentStatus}"`)
	next()
})

// Pre-delete middleware (single document)
paymentSchema.pre(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, async function (next) {
	// 'this' refers to the document being deleted
	const paymentId = this._id
	logger.warn(`Preparing to delete payment: ID ${paymentId}, Status "${this.paymentStatus}"`)
	next()
})

// Pre-delete-many middleware (query-based)
paymentSchema.pre('deleteMany', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.warn('Executing deleteMany on Payments with filter:', filter)
	next()
})

// Post-delete middleware
paymentSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	logger.warn(`Payment deleted successfully: ID ${doc._id}, Status "${doc.paymentStatus}"`)
	next()
})

paymentSchema.post('deleteMany', function (result, next) {
	logger.warn(`deleteMany on Payments completed. Deleted count: ${result.deletedCount}`)
	next()
})

// Compile the schema into a model
const PaymentModel = model<IPayment>('Payment', paymentSchema)

// Export the model
export default PaymentModel
