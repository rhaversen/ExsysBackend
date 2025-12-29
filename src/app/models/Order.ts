import { type Document, model, Schema, Types } from 'mongoose'

import { transformOrder } from '../controllers/orderController.js' // Assuming transformOrder is in orderController
import logger from '../utils/logger.js'
import { emitOrderCreated, emitOrderUpdated, emitOrderDeleted } from '../webSockets/orderHandlers.js' // Assuming these emitters

import ActivityModel, { IActivityFrontend } from './Activity.js'
import KioskModel, { IKioskFrontend } from './Kiosk.js'
import OptionModel, { IOptionFrontend } from './Option.js'
import ProductModel, { IProductFrontend } from './Product.js'
import RoomModel, { IRoomFrontend } from './Room.js'

// Interfaces
export interface IPayment {
	clientTransactionId?: string
	paymentStatus: 'pending' | 'successful' | 'failed'
}

export interface IOrderItem {
	id: Types.ObjectId // Reference to Product or Option ID
	quantity: number
}

export type PaymentStatus = 'pending' | 'successful' | 'failed'
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' // TODO: Add cancelled
export type CheckoutMethod = 'sumUp' | 'later' | 'mobilePay' | 'manual'

// Main Order Interface
export interface IOrder extends Document {
	// Properties
	_id: Types.ObjectId
	activityId: Types.ObjectId // The activity the order is for
	roomId: Types.ObjectId // The room the order is for
	kioskId?: Types.ObjectId // The kiosk the order is for (optional for manual orders)
	products: IOrderItem[]
	options?: IOrderItem[]
	status?: OrderStatus
	checkoutMethod: CheckoutMethod
	payment: IPayment

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Internal flag for middleware
	_wasNew?: boolean
}

export interface IOrderFrontend {
	_id: string
	products: Array<{ _id: IProductFrontend['_id'], quantity: number }>
	options: Array<{ _id: IOptionFrontend['_id'], quantity: number }>
	activityId: IActivityFrontend['_id']
	roomId: IRoomFrontend['_id']
	kioskId: IKioskFrontend['_id'] | null
	status: OrderStatus
	paymentStatus: PaymentStatus
	checkoutMethod: CheckoutMethod
	createdAt: Date
	updatedAt: Date
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

const paymentSchema = new Schema<IPayment>({
	clientTransactionId: {
		type: Schema.Types.String,
		trim: true
	},
	paymentStatus: {
		type: Schema.Types.String,
		enum: ['pending', 'successful', 'failed', 'refunded'],
		required: true
	}
}, { _id: false })

// Main Order Schema
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
		default: 'pending',
		required: [true, 'Ordre status er påkrævet']
	},
	payment: {
		type: paymentSchema,
		required: [true, 'Betalingsinformation er påkrævet']
	},
	checkoutMethod: {
		type: Schema.Types.String,
		enum: ['sumUp', 'later', 'mobilePay', 'manual'],
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

// Indexes
orderSchema.index({ createdAt: -1 }) // Index for sorting/querying by date
orderSchema.index({ 'payment.clientTransactionId': 1 }, { unique: true, sparse: true }) // Index for unique clientTransactionId within payment sub document
orderSchema.index({ products: 1 }) // Index for product queries
orderSchema.index({ options: 1 }) // Index for option queries
orderSchema.index({ kioskId: 1, createdAt: -1 }) // Index for kiosk-specific queries

// Pre-save middleware
orderSchema.pre('save', function (next) {
	this._wasNew = this.isNew
	if (this.isNew) {
		logger.debug(`Creating new order: Activity ID "${this.activityId.toString()}", Room ID "${this.roomId.toString()}"`)
	} else {
		logger.debug(`Updating order: ID ${this.id}`)
	}
	next()
})

// Post-save middleware
orderSchema.post('save', function (doc: IOrder, next) {
	logger.debug(`Order saved successfully: ID ${doc.id}`)
	try {
		const transformedOrder = transformOrder(doc)
		if (doc._wasNew ?? false) {
			logger.debug(`New order created: ID ${doc._id}, emitting order created event.`)
			emitOrderCreated(transformedOrder)
		} else {
			logger.debug(`Order updated: ID ${doc._id}, emitting order updated event.`)
			emitOrderUpdated(transformedOrder)
		}
	} catch (error) {
		logger.error(`Error emitting WebSocket event for Order ID ${doc.id} in post-save hook:`, { error })
	}
	if (doc._wasNew !== undefined) { delete doc._wasNew }
	next()
})

// Pre-delete middleware (single document)
orderSchema.pre(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, async function (next) {
	// 'this' refers to the document being deleted
	const orderId = this._id
	logger.warn(`Preparing to delete order: ID ${orderId}`)

	try {
		// Payment is embedded, so it will be deleted with the order. No separate deletion needed.
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
		// Payments are embedded, so they will be deleted with their parent orders.
		// No separate logic needed to delete payments.
		const docsToDelete = await OrderModel.find(filter).select('_id').lean() // Only need _id for logging
		const docIds = docsToDelete.map(doc => doc._id)

		if (docIds.length > 0) {
			logger.warn(`Preparing to delete ${docIds.length} orders via deleteMany: IDs [${docIds.join(', ')}]`)
		} else {
			logger.info('deleteMany on Orders: No documents matched the filter.')
		}
		next()
	} catch (error) {
		logger.error('Error in pre-deleteMany hook for Orders with filter:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteMany hook failed'))
	}
})

// Post-delete middleware (document-based)
orderSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	emitOrderDeleted(doc._id.toString())
	logger.warn(`Order deleted successfully: ID ${doc._id}`)
	next()
})

orderSchema.post('deleteMany', async function (result, next) {
	if (typeof result?.deletedCount === 'number' && result.deletedCount > 0) {
		const deletedOrders = await OrderModel.find(this.getFilter()).lean()
		for (const order of deletedOrders) {
			emitOrderDeleted(order._id.toString())
		}
	}
	logger.warn(`deleteMany on Orders completed. Deleted count: ${result.deletedCount}`)
	next()
})

// Compile the schema into a model
const OrderModel = model<IOrder>('Order', orderSchema)

// Export the model
export default OrderModel
