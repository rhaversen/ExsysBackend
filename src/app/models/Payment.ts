// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'

// Interfaces
export interface IPayment extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	clientTransactionId?: string
	paymentStatus: 'pending' | 'successful' | 'failed'

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Methods
}

// Schema
const paymentSchema = new Schema<IPayment>({
	clientTransactionId: {
		type: String
	},
	paymentStatus: {
		type: String,
		enum: ['pending', 'successful', 'failed'],
		default: 'pending'
	}
}, {
	timestamps: true
})

// Validations

// Pre-save middleware
paymentSchema.pre('save', async function (next) {
	logger.silly('Saving Payment')
	next()
})

// Payment methods

// Compile the schema into a model
const PaymentModel = model<IPayment>('Payment', paymentSchema)

// Export the model
export default PaymentModel
