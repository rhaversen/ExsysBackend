// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import OptionModel from './Option.js'
import ProductModel from './Product.js'
import ActivityModel from './Activity.js'

// Destructuring and global variables

// Interfaces
export interface IOrder extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	activityId: Schema.Types.ObjectId // The activity the order is for
	products: Array<{
		id: Schema.Types.ObjectId
		quantity: number
	}> // The products and their quantities
	options?: Array<{
		id: Schema.Types.ObjectId
		quantity: number
	}> // Additional options for the order
	status?: 'pending' | 'confirmed' | 'delivered'

	// Timestamps
	createdAt: Date
	updatedAt: Date
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
	activityId: {
		type: Schema.Types.ObjectId,
		ref: 'Activity',
		required: [true, 'Aktivitet er påkrævet']
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
	}
}, {
	timestamps: true
})

// Validations
orderSchema.path('activityId').validate(async function (v: Schema.Types.ObjectId) {
	const activity = await ActivityModel.findById(v)
	return activity !== null && activity !== undefined
}, 'Aktiviteten eksisterer ikke')

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
