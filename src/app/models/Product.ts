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
}

// Sub-schema for hours and minutes
const hourMinuteSubSchema = new Schema({
	hour: {
		type: Schema.Types.Number,
		required: [true, 'Fra-time er påkrævet'],
		min: [0, 'Fra-time skal være mere end eller lig 0'],
		max: [23, 'Fra-time skal være mindre end eller lig 23']
	},
	minute: {
		type: Schema.Types.Number,
		required: [true, 'Til-minut er påkrævet'],
		min: [0, 'Til-minut skal være mere end eller lig 0'],
		max: [59, 'Til-minut skal være mindre end eller lig 59']
	}
})

// Sub-schema for orderWindow
const orderWindowSubSchema = new Schema({
	from: {
		_id: false,
		type: hourMinuteSubSchema
	},
	to: {
		_id: false,
		type: hourMinuteSubSchema
	}
})

// Main product schema
const productSchema = new Schema<IProduct>({
	name: {
		type: Schema.Types.String,
		trim: true,
		required: [true, 'Navn er påkrævet'],
		maxLength: [20, 'Navnet må maks være 20 tegn lang']
	},
	price: {
		type: Schema.Types.Number,
		required: [true, 'Pris er påkrævet'],
		min: [0, 'prisen skal være større end eller lig 0']
	},
	description: {
		type: Schema.Types.String,
		trim: true,
		required: [true, 'Produkt beskrivelse er påkrævet'],
		maxLength: [50, 'Produkt beskrivelse må maks være 50 tegn lang']
	},
	options: [{
		type: Schema.Types.ObjectId,
		ref: 'Option'
	}],
	orderWindow: {
		_id: false,
		type: orderWindowSubSchema,
		required: [true, 'Bestillingsvindue er påkrævet']
	}
}, {
	timestamps: true
})

// Validations
productSchema.path('orderWindow').validate((v: {
	from: { hour: number, minute: number }
	to: { hour: number, minute: number }
}) => {
	return !(v.from.hour === v.to.hour && v.from.minute === v.to.minute)
}, 'Fra-tid kan ikke være det samme som til-tid')

productSchema.path('orderWindow.from.hour').validate((v: number) => {
	return Number.isInteger(v)
}, 'Fra-time skal være et heltal')

productSchema.path('orderWindow.from.minute').validate((v: number) => {
	return Number.isInteger(v)
}, 'Fra-minut skal være et heltal')

productSchema.path('orderWindow.to.hour').validate((v: number) => {
	return Number.isInteger(v)
}, 'Til-time skal være et heltal')

productSchema.path('orderWindow.to.minute').validate((v: number) => {
	return Number.isInteger(v)
}, 'Til-minut skal være et heltal')

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
