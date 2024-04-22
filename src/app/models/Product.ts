// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'

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

// Schema
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
		ref: 'Option'
	}],
	maxOrderQuantity: {
		type: Schema.Types.Number,
		required: [true, 'Max order quantity is required'],
		min: [1, 'Max order quantity must be greater than 0']
	},
	orderWindow: {
		type: Schema.Types.Mixed,
		required: [true, 'orderWindow is required'],
		validate: {
			validator: async function (v: any) {
				const fromTotalMinutes = v.from.hour * 60 + v.from.minute
				const toTotalMinutes = v.to.hour * 60 + v.to.minute
				return fromTotalMinutes < toTotalMinutes
			},
			message: 'The "from" time must be before the "to" time'
		},
		from: {
			type: Schema.Types.Mixed,
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
		},
		to: {
			type: Schema.Types.Mixed,
			hour: {
				type: Schema.Types.Number,
				required: [true, 'End hour is required'],
				min: [0, 'End hour must be between 0 and 23'],
				max: [23, 'End hour must be between 0 and 23']
			},
			minute: {
				type: Schema.Types.Number,
				required: [true, 'End minute is required'],
				min: [0, 'End minute must be between 0 and 59'],
				max: [59, 'End minute must be between 0 and 59']
			}
		}
	}
})

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
