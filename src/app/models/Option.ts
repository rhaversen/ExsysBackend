// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import ProductModel from './Product.js'
import OrderModel from './Order.js'

// Environment variables

// Config variables

// Destructuring and global variables

// Interfaces
export interface IOption extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	name: string // The name of the option
	imageURL?: string // An image of the option
	price: number // The price of the option

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

// Schema
const optionSchema = new Schema<IOption>({
	name: {
		type: Schema.Types.String,
		trim: true,
		required: [true, 'Navnet er påkrævet'],
		maxLength: [20, 'Navnet kan højest have 20 tegn']
	},
	imageURL: {
		type: Schema.Types.String,
		trim: true,
		maxLength: [200, 'Billede URL kan højest have 200 tegn']
	},
	price: {
		type: Schema.Types.Number,
		required: [true, 'Prisen er påkrævet'],
		min: [0, 'Prisen skal være større eller lig med 0']
	}
}, {
	timestamps: true
})

// Validations

// Adding indexes

// Pre-save middleware
optionSchema.pre('save', function (next) {
	logger.silly('Saving option')
	next()
})

// Pre-delete middleware
optionSchema.pre(['deleteOne', 'findOneAndDelete'], async function (next) {
	const doc = await OptionModel.findOne(this.getQuery())
	if (doc !== null && doc !== undefined) {
		logger.silly('Removing options from products with ID:', doc._id)
		// Remove the option from all products that have it
		await ProductModel.updateMany({ options: doc._id }, { $pull: { options: doc._id } })
		// Delete option from all orders
		await OrderModel.updateMany({ 'options.id': doc._id }, { $pull: { options: { id: doc._id } } })
	}
	next()
})

// Pre-delete-many middleware
optionSchema.pre('deleteMany', async function (next) {
	const docs = await OptionModel.find(this.getQuery())
	const docIds = docs.map(doc => doc._id)
	if (docIds.length > 0) {
		logger.silly('Removing options from products with IDs:', docIds)
		// Remove the options from all products that have them
		await ProductModel.updateMany({ options: { $in: docIds } }, { $pull: { options: { $in: docIds } } })
		// Delete options from all orders
		await OrderModel.updateMany({ 'options.id': { $in: docIds } }, { $pull: { options: { id: { $in: docIds } } } })
	}
	next()
})

// Compile the schema into a model
const OptionModel = model<IOption>('Option', optionSchema)

// Export the model
export default OptionModel
