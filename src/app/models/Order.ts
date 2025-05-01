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
	kioskId: Schema.Types.ObjectId // The kiosk the order is for
	products: Array<{
		id: Schema.Types.ObjectId
		quantity: number
	}> // The products and their quantities
	options?: Array<{
		id: Schema.Types.ObjectId
		quantity: number
	}> // Additional options for the order
	status?: 'pending' | 'confirmed' | 'delivered'
	paymentId: Schema.Types.ObjectId | IPayment

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

// Unified type for an order with populated fields
export type IOrderPopulated = Omit<IOrder, 'paymentId' | 'products' | 'options'> & {
	paymentId: Pick<IPayment, 'paymentStatus' | 'clientTransactionId' | '_id' | 'id'>
	products: Array<{ id: IProduct & { name: string }; quantity: number }>
	options?: Array<{ id: IOption & { name: string }; quantity: number }>
}

export interface IOrderFrontend {
	_id: string
	products: Array<{ _id: IProduct['_id'], name: string, quantity: number }>
	options: Array<{ _id: IOption['_id'], name: string, quantity: number }>
	activityId: IActivity['_id']
	roomId: IRoom['_id']
	kioskId: IKiosk['_id']
	status: 'pending' | 'confirmed' | 'delivered'
	paymentId: string
	paymentStatus: IPayment['paymentStatus']
	checkoutMethod: 'sumUp' | 'later'
	createdAt: string
	updatedAt: string
}

// Sub-schema for products
const productsSubSchema = new Schema({
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
})

// Sub-schema for options
const optionsSubSchema = new Schema({
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
})

// Main order schema
const orderSchema = new Schema({
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
		required: [true, 'Kiosk er påkrævet'],
		ref: 'Kiosk'
	},
	products: {
		_id: false,
		type: [productsSubSchema],
		required: [true, 'Produkter er påkrævet'],
		unique: true
	},
	options: {
		_id: false,
		type: [optionsSubSchema],
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
	}
}, {
	timestamps: true
})

// Validations
orderSchema.path('activityId').validate(async function (v: Schema.Types.ObjectId) {
	const activity = await ActivityModel.findById(v)
	return activity !== null && activity !== undefined
}, 'Aktiviteten eksisterer ikke')

orderSchema.path('roomId').validate(async function (v: Schema.Types.ObjectId) {
	const room = await RoomModel.findById(v)
	return room !== null && room !== undefined
}, 'Rummet eksisterer ikke')

orderSchema.path('kioskId').validate(async function (v: Schema.Types.ObjectId) {
	const kiosk = await KioskModel.findById(v)
	return kiosk !== null && kiosk !== undefined
}, 'Kiosken eksisterer ikke')

orderSchema.path('products').validate(function (v: Array<{ id: Schema.Types.ObjectId, quantity: number }>) {
	const unique = new Set(v.map(v => v.id))
	return unique.size === v.length
}, 'Produkterne skal være unikke')

orderSchema.path('products').validate(function (v: Array<{ id: Schema.Types.ObjectId, quantity: number }>) {
	return v.length > 0
}, 'Mindst et produkt er påkrævet')

orderSchema.path('products.id').validate(async function (v: Schema.Types.ObjectId) {
	const product = await ProductModel.findById(v)
	return product !== null && product !== undefined
}, 'Produktet eksisterer ikke')

orderSchema.path('products.id').validate(async function (v: Schema.Types.ObjectId) {
	const product = await ProductModel.findById(v)

	if (product === null || product === undefined) {
		return false
	}

	// Skip order window validation if this is an update operation
	if (!this.isNew) {
		return true
	}

	const now = new Date()
	const nowHour = now.getHours()
	const nowMinute = now.getMinutes()

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

	return isWithinHour || isStartHour || isEndHour
}, 'Bestillingen er uden for bestillingsvinduet')

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

// Adding indexes
orderSchema.index({ createdAt: 1 })
orderSchema.index({ paymentId: 1 })
orderSchema.index({ products: 1 })
orderSchema.index({ options: 1 })

// Pre-save middleware
orderSchema.pre('save', function (next) {
	logger.silly('Saving order')
	next()
})

// Compile the schema into a model
const OrderModel = model<IOrder>('Order', orderSchema)

// Export the model
export default OrderModel
