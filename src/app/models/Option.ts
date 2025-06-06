import { type Document, model, Schema } from 'mongoose'

import { transformOption } from '../controllers/optionController.js' // Import transformer
import { transformProduct } from '../controllers/productController.js'
import logger from '../utils/logger.js'
import { emitOptionCreated, emitOptionDeleted, emitOptionUpdated } from '../webSockets/optionHandlers.js' // Import emitters
import { emitProductUpdated } from '../webSockets/productHandlers.js' // Assuming path

import ProductModel from './Product.js'

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

	// Internal flag for middleware
	_wasNew?: boolean
}

export interface IOptionFrontend {
	_id: string
	name: string
	price: number
	imageURL?: string
	createdAt: Date
	updatedAt: Date
}

// Schema
const optionSchema = new Schema<IOption>({
	name: {
		type: Schema.Types.String,
		trim: true,
		unique: true,
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
optionSchema.path('name').validate(async function (value: string) {
	logger.silly(`Validating uniqueness for option name: "${value}", Current ID: ${this._id}`)
	const foundOption = await OptionModel.findOne({ name: value, _id: { $ne: this._id } }).lean()
	if (foundOption) {
		logger.warn(`Validation failed: Option name "${value}" already exists (ID: ${foundOption._id})`)
	}
	return !foundOption
}, 'Navnet er allerede i brug')

// Adding indexes

// Pre-save middleware
optionSchema.pre('save', function (next) {
	this._wasNew = this.isNew // Set _wasNew flag
	if (this.isNew) {
		logger.debug(`Creating new option: Name "${this.name}"`)
	} else {
		logger.debug(`Updating option: ID ${this.id}, Name "${this.name}"`)
	}
	next()
})

// Post-save middleware
optionSchema.post('save', function (doc: IOption, next) {
	logger.debug(`Option saved successfully: ID ${doc.id}, Name "${doc.name}"`)
	try {
		const transformedOption = transformOption(doc)
		if (doc._wasNew ?? false) {
			emitOptionCreated(transformedOption)
		} else {
			emitOptionUpdated(transformedOption)
		}
	} catch (error) {
		logger.error(`Error emitting WebSocket event for Option ID ${doc.id} in post-save hook:`, { error })
	}
	if (doc._wasNew !== undefined) { delete doc._wasNew } // Clean up
	next()
})

// Pre-delete middleware
optionSchema.pre('deleteOne', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.info('Preparing to delete Option matching filter:', filter)

	try {
		// Find the document that WILL be deleted to get its ID
		const docToDelete = await OptionModel.findOne(filter).select('_id name').lean()

		if (!docToDelete) {
			logger.warn('Pre-deleteOne hook (Option): No document found matching filter:', filter)
			return next()
		}

		const optionId = docToDelete._id
		logger.info(`Pre-deleteOne hook: Found Option to delete: ID ${optionId}, Name "${docToDelete.name}"`)

		// Find products that will be affected BEFORE the update
		const affectedProductsBeforeUpdate = await ProductModel.find({ options: optionId }).lean()

		// Remove option from Product.options
		logger.debug(`Removing option ID ${optionId} from Product options`)
		await ProductModel.updateMany(
			{ options: optionId },
			{ $pull: { options: optionId } }
		)
		logger.debug(`Option ID ${optionId} removal attempt from relevant Products completed`)

		// Emit updates for affected products
		for (const productDoc of affectedProductsBeforeUpdate) {
			const updatedProduct = await ProductModel.findById(productDoc._id)
			if (updatedProduct) {
				emitProductUpdated(transformProduct(updatedProduct))
			}
		}
		next()
	} catch (error) {
		logger.error('Error in pre-deleteOne hook for Option filter:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteOne hook failed'))
	}
})

// Pre-delete-many middleware
optionSchema.pre('deleteMany', async function (next) {
	const filter = this.getFilter()
	logger.warn('Executing deleteMany on Options with filter:', filter)

	try {
		const docsToDelete = await OptionModel.find(filter).select('_id').lean()
		const docIds = docsToDelete.map(doc => doc._id)

		if (docIds.length > 0) {
			logger.info(`Preparing to delete ${docIds.length} options via deleteMany: IDs [${docIds.join(', ')}]`)

			// Find products that will be affected BEFORE the update
			const affectedProductsBeforeUpdate = await ProductModel.find({ options: { $in: docIds } }).lean()

			// Remove options from Product.options
			logger.debug(`Removing option IDs [${docIds.join(', ')}] from Product options`)
			await ProductModel.updateMany(
				{ options: { $in: docIds } },
				{ $pull: { options: { $in: docIds } } }
			)
			logger.debug(`Option IDs [${docIds.join(', ')}] removed from relevant Products`)

			// Emit updates for affected products
			for (const productDoc of affectedProductsBeforeUpdate) {
				const updatedProduct = await ProductModel.findById(productDoc._id)
				if (updatedProduct) {
					emitProductUpdated(transformProduct(updatedProduct))
				}
			}
		} else {
			logger.info('deleteMany on Options: No documents matched the filter.')
		}
		next()
	} catch (error) {
		logger.error('Error in pre-deleteMany hook for Options with filter:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteMany hook failed'))
	}
})

// Post-delete middleware
optionSchema.post('deleteOne', { document: true, query: false }, function (doc, next) {
	logger.info(`Option deleted successfully: ID ${doc._id}, Name "${doc.name}"`)
	try {
		emitOptionDeleted(doc.id) // Emit with ID
	} catch (error) {
		logger.error(`Error emitting WebSocket event for deleted Option ID ${doc.id} in post-delete hook:`, { error })
	}
	next()
})

optionSchema.post('deleteMany', function (result, next) {
	logger.info(`deleteMany on Options completed. Deleted count: ${result.deletedCount}`)
	next()
})

// Compile the schema into a model
const OptionModel = model<IOption>('Option', optionSchema)

// Export the model
export default OptionModel
