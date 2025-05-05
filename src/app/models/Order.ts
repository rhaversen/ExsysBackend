import { type Document, model, Schema } from 'mongoose'

import logger from '../utils/logger.js'

import ActivityModel, { IActivity } from './Activity.js'
import KioskModel, { IKiosk } from './Kiosk.js'
import OptionModel, { type IOption } from './Option.js'
import PaymentModel, { type IPayment } from './Payment.js'
import ProductModel, { type IProduct } from './Product.js'
import RoomModel, { IRoom } from './Room.js'

// Interfaces
export interface IOrder extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	activityId: Schema.Types.ObjectId // The activity the order is for
	roomId: Schema.Types.ObjectId // The room the order is for
	kioskId: Schema.Types.ObjectId | null // The kiosk the order is for (optional)
	products: Array<{
		id: Schema.Types.ObjectId
		quantity: number
	}> // The products and their quantities
	options?: Array<{
		id: Schema.Types.ObjectId
		quantity: number
	}> // Additional options for the order
	status?: 'pending' | 'confirmed' | 'delivered'
	checkoutMethod: 'sumUp' | 'later' | 'manual' // The checkout method used for the order
	paymentId: Schema.Types.ObjectId | IPayment

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

// Unified type for an order with populated fields
export type IOrderPopulated = Omit<IOrder, 'paymentId' | 'products' | 'options' | 'kioskId'> & {
	paymentId: Pick<IPayment, 'paymentStatus' | 'clientTransactionId' | '_id' | 'id'>
	products: Array<{ id: IProduct & { name: string }; quantity: number }>
	options?: Array<{ id: IOption & { name: string }; quantity: number }>
	kioskId: IKiosk['_id'] | null
}

export interface IOrderFrontend {
	_id: string
	products: Array<{ _id: IProduct['_id'], name: string, quantity: number }>
	options: Array<{ _id: IOption['_id'], name: string, quantity: number }>
	activityId: IActivity['_id']
	roomId: IRoom['_id']
	kioskId: IKiosk['_id'] | null
	status: 'pending' | 'confirmed' | 'delivered'
	paymentId: string
	paymentStatus: IPayment['paymentStatus']
	checkoutMethod: 'sumUp' | 'later' | 'manual'
	createdAt: string
	updatedAt: string
}

// Sub-schema for products
const orderProductSchema = new Schema({
	id: {
		type: Schema.Types.ObjectId,
		ref: 'Product',
		required: [true, 'Produkt er påkrævet']
	},
	quantity: {
		type: Schema.Types.Number,
		required: [true, 'Mængde er påkrævet'],
		min: [1, 'Mængde skal være større end 0']
	}
}, { _id: false }) // No separate _id for sub-schemas

// Sub-schema for options
const orderOptionSchema = new Schema({
	id: {
		type: Schema.Types.ObjectId,
		ref: 'Option',
		required: [true, 'Tilvalg er påkrævet']
	},
	quantity: {
		type: Schema.Types.Number,
		required: [true, 'Mængde er påkrævet'],
		min: [1, 'Mængde skal være større end 0']
	}
}, { _id: false }) // No separate _id for sub-schemas

// Main order schema
const orderSchema = new Schema<IOrder>({
	activityId: {
		type: Schema.Types.ObjectId,
		ref: 'Activity',
		required: [true, 'Aktivitet er påkrævet']
	},
	roomId: {
		type: Schema.Types.ObjectId,
		required: [true, 'Rum er påkrævet'],
		ref: 'Room'
	},
	kioskId: {
		type: Schema.Types.ObjectId,
		default: null,
		ref: 'Kiosk'
	},
	products: {
		_id: false,
		type: [orderProductSchema],
		required: [true, 'Produkter er påkrævet'],
		unique: true
	},
	options: {
		_id: false,
		type: [orderOptionSchema],
		unique: true,
		default: undefined
	},
	status: {
		type: Schema.Types.String,
		enum: ['pending', 'confirmed', 'delivered'],
		default: 'pending'
	},
	paymentId: {
		type: Schema.Types.ObjectId,
		required: [true, 'Betaling er påkrævet'],
		ref: 'Payment'
	},
	checkoutMethod: {
		type: Schema.Types.String,
		enum: ['sumUp', 'later', 'manual'],
		required: [true, 'Checkout metode er påkrævet']
	}
}, {
	timestamps: true
})

// Validations
orderSchema.path('activityId').validate(async function (value: Schema.Types.ObjectId) {
	logger.silly(`Validating existence for activityId: "${value}", Order ID: ${this._id}`)
	const exists = await ActivityModel.findById(value).lean()
	if (!exists) { logger.warn(`Validation failed: activityId "${value}" does not exist. Order ID: ${this._id}`) }
	return !!exists
}, 'Den valgte aktivitet findes ikke')

orderSchema.path('roomId').validate(async function (value: Schema.Types.ObjectId) {
	logger.silly(`Validating existence for roomId: "${value}", Order ID: ${this._id}`)
	const exists = await RoomModel.findById(value).lean()
	if (!exists) { logger.warn(`Validation failed: roomId "${value}" does not exist. Order ID: ${this._id}`) }
	return !!exists
}, 'Det valgte rum findes ikke')

orderSchema.path('kioskId').validate(async function (value: Schema.Types.ObjectId | null) {
	// Only validate if kioskId is provided (not null or undefined)
	if (value == null) {
		logger.silly(`Skipping existence validation for null kioskId, Order ID: ${this._id}`)
		return true
	}
	logger.silly(`Validating existence for kioskId: "${value}", Order ID: ${this._id}`)
	const exists = await KioskModel.findById(value).lean()
	if (!exists) { logger.warn(`Validation failed: kioskId "${value}" does not exist. Order ID: ${this._id}`) }
	return !!exists
}, 'Den valgte kiosk findes ikke')

orderSchema.path('products').validate(function (v: Array<{ id: Schema.Types.ObjectId, quantity: number }>) {
	const unique = new Set(v.map(v => v.id))
	return unique.size === v.length
}, 'Produkterne skal være unikke')

// Modify this validator
orderSchema.path('products').validate(function (this: IOrder, v: Array<{ id: Schema.Types.ObjectId, quantity: number }>) {
	// Skip check if checkout method is manual
	if (this.checkoutMethod === 'manual') {
		return true
	}
	// Otherwise, ensure at least one product is present
	return v.length > 0
}, 'Mindst et produkt er påkrævet')

orderSchema.path('products.id').validate(async function (v: Schema.Types.ObjectId) {
	const product = await ProductModel.findById(v)
	return product !== null && product !== undefined
}, 'Produktet eksisterer ikke')

orderSchema.path('products').validate(async function (this: IOrder, products: Array<{ id: Schema.Types.ObjectId, quantity: number }>) {
	// Skip order window validation if this is an update operation or if the document is not new
	if (this.isNew === false) {
		logger.silly(`Skipping order window validation for existing order update: ID ${this._id}`)
		return true
	}

	// Skip validation for manual checkout method
	if (this.checkoutMethod === 'manual') {
		logger.silly(`Skipping order window validation for checkout method: ${this.checkoutMethod}`)
		return true
	}

	const now = new Date()
	const nowHour = now.getHours()
	const nowMinute = now.getMinutes()

	for (const p of products) {
		const product = await ProductModel.findById(p.id).lean()

		if (product == null) {
			// Validation for product existence is handled by the other validator
			// If product is null here, let the other validator fail it.
			logger.warn(`Order window validation skipped: Product not found (ID: ${p.id}). Relying on existence validator.`)
			continue // Skip to the next product, existence check will handle this
		}

		const from = product.orderWindow.from
		const to = product.orderWindow.to

		let isWithinHour, isStartHour, isEndHour

		if (from.hour <= to.hour) {
			// Time window does not cross midnight
			isWithinHour = from.hour < nowHour && nowHour < to.hour
			isStartHour = nowHour === from.hour && nowMinute >= from.minute
			isEndHour = nowHour === to.hour && nowMinute <= to.minute
		} else {
			// Time window crosses midnight
			isWithinHour = from.hour < nowHour || nowHour < to.hour
			isStartHour = nowHour === from.hour && nowMinute >= from.minute
			isEndHour = nowHour === to.hour && nowMinute <= to.minute
		}

		const isWithinOrderWindow = isWithinHour || isStartHour || isEndHour

		if (!isWithinOrderWindow) {
			logger.warn(`Order window validation failed for Product ${p.id} in Order ${this._id}. Now=${now}, Window=[${JSON.stringify(product.orderWindow)}]`)
			// Use a generic message or customize as needed
			this.invalidate('products', `Produktet "${product.name ?? p.id}" er uden for bestillingsvinduet.`, p.id)
			return false // Fail validation
		}
	}

	return true // All products are within their order window
}, 'Et eller flere produkter er uden for deres bestillingsvindue')

orderSchema.path('products.quantity').validate(function (v: number) {
	return Number.isInteger(v)
}, 'Produkt mængde skal være et heltal')

orderSchema.path('options').validate(function (v: Array<{ id: Schema.Types.ObjectId, quantity: number }>) {
	const unique = new Set(v.map(v => v.id))
	return unique.size === v.length
}, 'Tilvalgene skal være unikke')

orderSchema.path('options.id').validate(async function (v: Schema.Types.ObjectId) {
	const option = await OptionModel.findById(v)
	return option !== null && option !== undefined
}, 'Tilvalget eksisterer ikke')

orderSchema.path('options.quantity').validate(function (v: number) {
	return Number.isInteger(v)
}, 'Tilvalg mængde skal være et heltal')

orderSchema.path('paymentId').validate(async function (v: Schema.Types.ObjectId) {
	const payment = await PaymentModel.findById(v)
	return payment !== null && payment !== undefined
}, 'Betalingen eksisterer ikke')

// Indexes
orderSchema.index({ createdAt: -1 }) // Index for sorting/querying by date
orderSchema.index({ paymentId: 1 }, { unique: true }) // Ensure one order per payment
orderSchema.index({ products: 1 }) // Index for product queries
orderSchema.index({ options: 1 }) // Index for option queries
orderSchema.index({ kioskId: 1, createdAt: -1 }) // Index for kiosk-specific queries

// Pre-save middleware
orderSchema.pre('save', function (next) {
	if (this.isNew) {
		logger.info(`Creating new order: Kiosk ${this.kioskId ?? 'Manual'}, Activity ${this.activityId}, Payment ${this.paymentId}`)
	} else {
		logger.debug(`Updating order: ID ${this.id}`)
	}
	next()
})

// Post-save middleware
orderSchema.post('save', function (doc, next) {
	logger.info(`Order saved successfully: ID ${doc.id}, Status ${doc.status}`)
	next()
})

// Pre-delete middleware (single document)
orderSchema.pre(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, async function (next) {
	// 'this' refers to the document being deleted
	const orderId = this._id
	logger.warn(`Preparing to delete order: ID ${orderId}`)

	try {
		// Optionally delete the associated payment if it's not shared
		const paymentId = this.paymentId
		if (paymentId != null) {
			// Check if other orders use this payment (shouldn't happen with unique index, but good practice)
			const otherOrders = await OrderModel.countDocuments({ paymentId, _id: { $ne: orderId } })
			if (otherOrders === 0) {
				logger.info(`Deleting associated payment for order ID ${orderId}: Payment ID ${paymentId}`)
				await PaymentModel.findByIdAndDelete(paymentId)
			} else {
				logger.warn(`Order ID ${orderId} is being deleted, but its Payment ID ${paymentId} is potentially shared. Payment not deleted.`)
			}
		}
		next()
	} catch (error) {
		logger.error(`Error in pre-delete hook for order ID ${orderId}`, { error })
		next(error instanceof Error ? error : new Error('Pre-delete hook failed'))
	}
})

// Pre-delete-many middleware (query-based)
orderSchema.pre('deleteMany', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.warn('Executing deleteMany on Orders with filter:', filter)

	try {
		const docsToDelete = await OrderModel.find(filter).select('paymentId _id').lean()
		const docIds = docsToDelete.map(doc => doc._id)
		const paymentIdsToDelete = docsToDelete
			.map(doc => doc.paymentId)

		if (docIds.length > 0) {
			logger.warn(`Preparing to delete ${docIds.length} orders via deleteMany: IDs [${docIds.join(', ')}]`)

			// Delete associated payments (assuming 1-to-1 relationship enforced by index)
			if (paymentIdsToDelete.length > 0) {
				logger.info(`Deleting ${paymentIdsToDelete.length} associated payments for orders being deleted via deleteMany.`)
				await PaymentModel.deleteMany({ _id: { $in: paymentIdsToDelete } })
			}
		} else {
			logger.info('deleteMany on Orders: No documents matched the filter.')
		}
		next()
	} catch (error) {
		logger.error('Error in pre-deleteMany hook for Orders with filter:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteMany hook failed'))
	}
})

// Post-delete middleware
orderSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	logger.warn(`Order deleted successfully: ID ${doc._id}`)
	next()
})

orderSchema.post('deleteMany', function (result, next) {
	logger.warn(`deleteMany on Orders completed. Deleted count: ${result.deletedCount}`)
	next()
})

// Compile the schema into a model
const OrderModel = model<IOrder>('Order', orderSchema)

// Export the model
export default OrderModel
