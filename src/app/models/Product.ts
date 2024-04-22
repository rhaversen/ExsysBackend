// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import OptionModel from './Option.js'

// Destructuring and global variables

// Interfaces
export interface IProduct extends Document {
	_id: Types.ObjectId
	name: string
	price: number
	description: string
	availability: number
	orderWindow: {
		from: {
			hour: number
			minute: number
		}
		to: {
			hour: number
			minute: number
		}
	}
	options?: Types.ObjectId[]
	maxOrderQuantity: number
}

// Sub-schema for hours and minutes
const hourMinuteSubSchema = new Schema({
	hour: {
		type: Schema.Types.Number,
		required: [true, 'Start hour is required'],
		min: [0, 'Start hour must be between 0 and 23'],
		max: [23, 'Start hour must be between 0 and 23']
	},
	minute: {
		type: Schema.Types.Number,
		required: [true, 'Start minute is required'],
		min: [0, 'Start minute must be between 0 and 59'],
		max: [59, 'Start minute must be between 0 and 59']
	}
})

// Sub-schema for orderWindow
const orderWindowSubSchema = new Schema({
	from: {
		type: hourMinuteSubSchema
	},
	to: {
		type: hourMinuteSubSchema
	}
})

// Main product schema
const productSchema = new Schema<IProduct>({
	name: {
		type: Schema.Types.String,
		required: [true, 'Product name is required'],
		maxLength: [20, 'Produkt navn må maks være 20 tegn lang']
	},
	price: {
		type: Schema.Types.Number,
		required: [true, 'Product price is required'],
		min: [0, 'Pris skal være 0 eller over']
	},
	description: {
		type: Schema.Types.String,
		required: [true, 'Product description is required'],
		maxLength: [50, 'Produkt beskrivelse må maks være 50 tegn lang']
	},
	availability: {
		type: Schema.Types.Number,
		required: [true, 'Product availability is required'],
		min: [0, 'Availability cannot be negative']
	},
	options: [{
		type: Schema.Types.ObjectId,
		unique: true,
		ref: 'Option'
	}],
	maxOrderQuantity: {
		type: Schema.Types.Number,
		required: [true, 'Max order quantity is required'],
		min: [1, 'Max order quantity must be greater than 0']
	},
	orderWindow: {
		type: orderWindowSubSchema,
		required: [true, 'orderWindow is required']
	}
})

// Validations
productSchema.path('orderWindow').validate((v: {
	from: { hour: number, minute: number }
	to: { hour: number, minute: number }
}) => {
	const fromTotalMinutes = v.from.hour * 60 + v.from.minute
	const toTotalMinutes = v.to.hour * 60 + v.to.minute
	return fromTotalMinutes < toTotalMinutes
}, 'The "from" time must be before the "to" time')

productSchema.path('availability').validate((v: number) => {
	return Number.isInteger(v)
}, 'Availability must be an integer')

productSchema.path('maxOrderQuantity').validate((v: number) => {
	return Number.isInteger(v)
}, 'Max order quantity must be an integer')

productSchema.path('maxOrderQuantity').validate((v: number) => {
	return Number.isInteger(v)
}, 'Max order quantity must be an integer')

productSchema.path('orderWindow.from.hour').validate((v: number) => {
	return Number.isInteger(v)
}, 'Hours must be an integer')

productSchema.path('orderWindow.from.minute').validate((v: number) => {
	return Number.isInteger(v)
}, 'Minutes must be an integer')

productSchema.path('orderWindow.to.hour').validate((v: number) => {
	return Number.isInteger(v)
}, 'Hours must be an integer')

productSchema.path('orderWindow.to.minute').validate((v: number) => {
	return Number.isInteger(v)
}, 'Minutes must be an integer')

productSchema.path('options').validate(async function (v: Types.ObjectId[]) {
	const options = await OptionModel.find({ _id: { $in: v } })
	return options.length === v.length
}, 'Tilvalget eksisterer ikke')

productSchema.path('options').validate(function (v: Types.ObjectId[]) {
	const unique = new Set(v.map(v => v))
	return unique.size === v.length
}, 'Produkterne skal være unikke')

// Adding indexes

// Pre-save middleware
productSchema.pre('save', function (next) {
	logger.silly('Saving product')
	next()
})

// Compile the schema into a model
const ProductModel = model<IProduct>('Product', productSchema)

// Export the model
export default ProductModel
