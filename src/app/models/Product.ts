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
	availability: {
		type: Schema.Types.Number,
		required: [true, 'Produkt rådighed er påkrævet'],
		min: [0, 'Rådighed skal være større end eller lig 0']
	},
	options: [{
		type: Schema.Types.ObjectId,
		unique: true,
		ref: 'Option'
	}],
	maxOrderQuantity: {
		type: Schema.Types.Number,
		required: [true, 'Maksimal bestillingsmængde er påkrævet'],
		min: [1, 'Maksimal bestillingsmængde skal være større end eller lig 0']
	},
	orderWindow: {
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
	const fromTotalMinutes = v.from.hour * 60 + v.from.minute
	const toTotalMinutes = v.to.hour * 60 + v.to.minute
	return fromTotalMinutes < toTotalMinutes
}, 'Fra-tid skal være før til-tid')

productSchema.path('availability').validate((v: number) => {
	return Number.isInteger(v)
}, 'Rådighed skal være et heltal')

productSchema.path('maxOrderQuantity').validate((v: number) => {
	return Number.isInteger(v)
}, 'Maksimal bestillingsmængde skal være et heltal')

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
