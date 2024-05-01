// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import OptionModel from './Option.js'
import ProductModel from './Product.js'
import RoomModel from './Room.js'

// Destructuring and global variables

// Interfaces
export interface IOrder extends Document {
	_id: Types.ObjectId
	roomId: Types.ObjectId // Reference to the Room document
	products: Array<{
		id: Types.ObjectId
		quantity: number
	}> // The products and their quantities
	options?: Array<{
		id: Types.ObjectId
		quantity: number
	}> // Additional options for the order
}

// Sub-schema for products
const productsSubSchema = new Schema({
	id: {
		type: Schema.Types.ObjectId,
		ref: 'Product',
		required: [true, 'Produkt er påkrevet']
	},
	quantity: {
		type: Schema.Types.Number,
		required: [true, 'Mængde er påkrevet'],
		min: [1, 'Mængde skal være større end 0']
	}
})

// Sub-schema for options
const optionsSubSchema = new Schema({
	id: {
		type: Schema.Types.ObjectId,
		ref: 'Option',
		required: [true, 'Tilvalg er påkrevet']
	},
	quantity: {
		type: Schema.Types.Number,
		required: [true, 'Mængde er påkrevet'],
		min: [1, 'Mængde skal være større end 0']
	}
})

// Main order schema
const orderSchema = new Schema({
	roomId: {
		type: Schema.Types.ObjectId,
		ref: 'Room',
		required: [true, 'Rum er påkrevet']
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
	}
}, {
	timestamps: true
})

// Validations
orderSchema.path('roomId').validate(async function (v: Types.ObjectId) {
	const room = await RoomModel.findById(v)
	return room !== null && room !== undefined
}, 'Rummet eksisterer ikke')

orderSchema.path('products').validate(function (v: Array<{ id: Types.ObjectId, quantity: number }>) {
	const unique = new Set(v.map(v => v.id))
	return unique.size === v.length
}, 'Produkterne skal være unikke')

orderSchema.path('products').validate(function (v: Array<{ id: Types.ObjectId, quantity: number }>) {
	return v.length > 0
}, 'Mindst et produkt er påkrævet')

orderSchema.path('products.id').validate(async function (v: Types.ObjectId) {
	const product = await ProductModel.findById(v)
	return product !== null && product !== undefined
}, 'Produktet eksisterer ikke')

orderSchema.path('products.id').validate(async function (v: Types.ObjectId) {
	const product = await ProductModel.findById(v)

	if (product === null || product === undefined) {
		return false
	}

	const now = new Date()
	const nowHour = now.getUTCHours()
	const nowMinute = now.getUTCMinutes()

	const from = product.orderWindow.from
	const to = product.orderWindow.to

	const isWithinHour = from.hour < nowHour && nowHour < to.hour
	const isStartHour = nowHour === from.hour && nowMinute >= from.minute
	const isEndHour = nowHour === to.hour && nowMinute <= to.minute

	return isWithinHour || isStartHour || isEndHour
}, 'Bestillingen er uden for bestillingsvinduet')

orderSchema.path('products.quantity').validate(function (v: number) {
	return Number.isInteger(v)
}, 'Produkt mængde skal være et heltal')

orderSchema.path('options').validate(function (v: Array<{ id: Types.ObjectId, quantity: number }>) {
	const unique = new Set(v.map(v => v.id.id))
	return unique.size === v.length
}, 'Tilvalgene skal være unikke')

orderSchema.path('options.id').validate(async function (v: Types.ObjectId) {
	const option = await OptionModel.findById(v)
	return option !== null && option !== undefined
}, 'Tilvalget eksisterer ikke')

orderSchema.path('options.quantity').validate(function (v: number) {
	return Number.isInteger(v)
}, 'Tilvalg mængde skal være et heltal')

// Adding indexes
orderSchema.index({ createdAt: 1 })

// Pre-save middleware
orderSchema.pre('save', function (next) {
	logger.silly('Saving order')
	next()
})

// Compile the schema into a model
const OrderModel = model<IOrder>('Order', orderSchema)

// Export the model
export default OrderModel
