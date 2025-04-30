// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import OptionModel from './Option.js'
import OrderModel from './Order.js'

// Environment variables

// Config variables

// Destructuring and global variables

// Interfaces
export interface IProduct extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	name: string
	price: number
	imageURL?: string
	isActive: boolean
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
	options?: Schema.Types.ObjectId[]

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

// Sub-schema for fromTime
const fromTimeSubSchema = new Schema({
	hour: {
		type: Schema.Types.Number,
		required: [true, 'Fra-time er påkrævet'],
		min: [0, 'Fra-time skal være mere end eller lig 0'],
		max: [23, 'Fra-time skal være mindre end eller lig 23']
	},
	minute: {
		type: Schema.Types.Number,
		required: [true, 'Fra-minut er påkrævet'],
		min: [0, 'Fra-minut skal være mere end eller lig 0'],
		max: [59, 'Fra-minut skal være mindre end eller lig 59']
	}
})

// Sub-schema for toTime
const toTimeSubSchema = new Schema({
	hour: {
		type: Schema.Types.Number,
		required: [true, 'Til-time er påkrævet'],
		min: [0, 'Til-time skal være mere end eller lig 0'],
		max: [23, 'Til-time skal være mindre end eller lig 23']
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
		type: fromTimeSubSchema
	},
	to: {
		_id: false,
		type: toTimeSubSchema
	}
})

// Main product schema
const productSchema = new Schema<IProduct>({
	name: {
		type: Schema.Types.String,
		trim: true,
		required: [true, 'Navn er påkrævet'],
		maxLength: [15, 'Navnet må max være 15 tegn lang']
	},
	price: {
		type: Schema.Types.Number,
		required: [true, 'Pris er påkrævet'],
		min: [0, 'prisen skal være større end eller lig 0']
	},
	imageURL: {
		type: Schema.Types.String,
		trim: true,
		maxLength: [200, 'Billede URL må max være 200 tegn lang']
	},
	isActive: {
		type: Schema.Types.Boolean,
		default: true
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

productSchema.path('orderWindow.from.hour').validate(function (v: number) {
	return Number.isInteger(v)
}, 'Fra-time skal være et heltal')

productSchema.path('orderWindow.from.minute').validate(function (v: number) {
	return Number.isInteger(v)
}, 'Fra-minut skal være et heltal')

productSchema.path('orderWindow.to.hour').validate(function (v: number) {
	return Number.isInteger(v)
}, 'Til-time skal være et heltal')

productSchema.path('orderWindow.to.minute').validate(function (v: number) {
	return Number.isInteger(v)
}, 'Til-minut skal være et heltal')

productSchema.path('options').validate(async function (v: Schema.Types.ObjectId[]) {
	const options = await OptionModel.find({ _id: { $in: v } })
	return options.length === v.length
}, 'Tilvalget eksisterer ikke')

productSchema.path('options').validate(function (v: Schema.Types.ObjectId[]) {
	const unique = new Set(v)
	return unique.size === v.length
}, 'Produkterne skal være unikke')

// Adding indexes

// Pre-save middleware
productSchema.pre('save', function (next) {
	logger.silly('Saving product')
	next()
})

// Pre-delete middleware
productSchema.pre(['deleteOne', 'findOneAndDelete'], async function (next) {
	const doc = await ProductModel.findOne(this.getQuery())
	if (doc !== null && doc !== undefined) {
		logger.silly('Removing product from orders with ID:', doc._id)
		// Delete product from all orders and delete orders which are now empty
		await OrderModel.bulkWrite([
			{
				updateMany: {
					filter: { 'products.id': doc._id },
					update: { $pull: { products: { id: doc._id } } }
				}
			},
			{
				deleteMany: {
					filter: { products: { $size: 0 } }
				}
			}
		])
	}
	next()
})

// Pre-delete-many middleware
productSchema.pre('deleteMany', async function (next) {
	const docs = await ProductModel.find(this.getQuery())
	const docIds = docs.map(doc => doc._id)
	if (docIds.length > 0) {
		logger.silly('Removing products from orders with IDs:', docIds)
		// Delete products from all orders and delete orders which are now empty
		await OrderModel.bulkWrite([
			{
				updateMany: {
					filter: { 'products.id': { $in: docIds } },
					update: { $pull: { products: { id: { $in: docIds } } } }
				}
			},
			{
				deleteMany: {
					filter: { products: { $size: 0 } }
				}
			}
		])
	}
	next()
})

// Compile the schema into a model
const ProductModel = model<IProduct>('Product', productSchema)

// Export the model
export default ProductModel
