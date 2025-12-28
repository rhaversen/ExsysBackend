import { type Document, model, Schema, Types } from 'mongoose'

import { transformActivity } from '../controllers/activityController.js'
import { transformProduct } from '../controllers/productController.js'
import logger from '../utils/logger.js'
import { emitActivityUpdated } from '../webSockets/activityHandlers.js'
import { emitProductCreated, emitProductDeleted, emitProductUpdated } from '../webSockets/productHandlers.js'

import ActivityModel from './Activity.js'
import OptionModel, { IOptionFrontend } from './Option.js'

// Interfaces
export interface Time {
	hour: number
	minute: number
}

export interface OrderWindow {
	from: Time
	to: Time
}

export interface IProduct extends Document {
	// Properties
	_id: Types.ObjectId
	name: string
	price: number
	imageURL?: string
	isActive: boolean
	orderWindow: OrderWindow
	options?: Schema.Types.ObjectId[]

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Internal flag for middleware
	_wasNew?: boolean
}

export interface IProductFrontend {
	_id: string
	name: string
	price: number
	orderWindow: OrderWindow
	options: Array<IOptionFrontend['_id']>
	isActive: boolean
	imageURL?: string
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
		unique: true,
		required: [true, 'Navnet er påkrævet'],
		maxLength: [50, 'Navnet kan højest have 50 tegn']
	},
	price: {
		type: Schema.Types.Number,
		required: [true, 'Prisen er påkrævet'],
		min: [0, 'Prisen skal være større eller lig med 0']
	},
	imageURL: {
		type: Schema.Types.String,
		trim: true,
		maxLength: [200, 'Billede URL kan højest have 200 tegn']
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
productSchema.path('name').validate(async function (value: string) {
	logger.silly(`Validating uniqueness for product name: "${value}", Current ID: ${this._id}`)
	const foundProduct = await ProductModel.findOne({ name: value, _id: { $ne: this._id } }).lean()
	if (foundProduct) {
		logger.warn(`Validation failed: Product name "${value}" already exists (ID: ${foundProduct._id})`)
	}
	return !foundProduct
}, 'Navnet er allerede i brug')

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

// Pre-save middleware
productSchema.pre('save', function (next) {
	this._wasNew = this.isNew
	if (this.isNew) {
		logger.debug(`Creating new product: Name "${this.name}"`)
	} else {
		logger.debug(`Updating product: ID ${this.id}, Name "${this.name}"`)
	}
	next()
})

// Post-save middleware
productSchema.post('save', function (doc: IProduct, next) {
	logger.debug(`Product saved successfully: ID ${doc.id}, Name "${doc.name}"`)
	try {
		const transformedProduct = transformProduct(doc)
		if (doc._wasNew ?? false) {
			emitProductCreated(transformedProduct)
		} else {
			emitProductUpdated(transformedProduct)
		}
	} catch (error) {
		logger.error(`Error emitting WebSocket event for Product ID ${doc.id} in post-save hook:`, { error })
	}
	if (doc._wasNew !== undefined) { delete doc._wasNew }
	next()
})

// Pre-delete middleware
productSchema.pre('deleteOne', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.info('Preparing to delete Product matching filter:', filter)

	try {
		// Find the document that WILL be deleted to get its ID
		const docToDelete = await ProductModel.findOne(filter).select('_id name').lean()

		if (!docToDelete) {
			logger.warn('Pre-deleteOne hook (Product): No document found matching filter:', filter)
			return next()
		}

		const productId = docToDelete._id
		logger.info(`Pre-deleteOne hook: Found Product to delete: ID ${productId}, Name "${docToDelete.name}"`)

		// Find activities that will be affected BEFORE the update
		const affectedActivitiesBeforeUpdate = await ActivityModel.find({ disabledProducts: productId }).lean()

		// Remove product from Activity.disabledProducts
		logger.debug(`Removing product ID ${productId} from Activity disabledProducts`)
		await ActivityModel.updateMany(
			{ disabledProducts: productId },
			{ $pull: { disabledProducts: productId } }
		)
		logger.debug(`Product ID ${productId} removal attempt from relevant Activities completed`)

		// Emit updates for affected activities
		for (const activityDoc of affectedActivitiesBeforeUpdate) {
			const updatedActivity = await ActivityModel.findById(activityDoc._id)
			if (updatedActivity) {
				emitActivityUpdated(transformActivity(updatedActivity))
			}
		}

		logger.info(`Product deleted successfully: ID ${productId}, Name "${docToDelete.name}"`)
		emitProductDeleted(productId.toString())

		next()
	} catch (error) {
		logger.error('Error in pre-deleteOne hook for Product filter:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteOne hook failed'))
	}
})

// Pre-delete-many middleware (query-based)
productSchema.pre('deleteMany', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.warn('Executing deleteMany on Products with filter:', filter)

	try {
		const docsToDelete = await ProductModel.find(filter).select('_id').lean()
		const docIds = docsToDelete.map(doc => doc._id)

		if (docIds.length > 0) {
			logger.info(`Preparing to delete ${docIds.length} products via deleteMany: IDs [${docIds.join(', ')}]`)

			// Find activities that will be affected BEFORE the update
			const affectedActivitiesBeforeUpdate = await ActivityModel.find({ disabledProducts: { $in: docIds } }).lean()

			// Remove products from Activity.disabledProducts
			logger.debug(`Removing product IDs [${docIds.join(', ')}] from Activity.disabledProducts`)
			await ActivityModel.updateMany(
				{ disabledProducts: { $in: docIds } },
				{ $pull: { disabledProducts: { $in: docIds } } }
			)
			logger.debug(`Product IDs [${docIds.join(', ')}] removed from relevant Activities`)

			// Emit updates for affected activities
			for (const activityDoc of affectedActivitiesBeforeUpdate) {
				const updatedActivity = await ActivityModel.findById(activityDoc._id)
				if (updatedActivity) {
					emitActivityUpdated(transformActivity(updatedActivity))
				}
			}
		} else {
			logger.info('deleteMany on Products: No documents matched the filter.')
		}
		next()
	} catch (error) {
		logger.error('Error in pre-deleteMany hook for Products with filter:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteMany hook failed'))
	}
})

// Post-delete middleware
productSchema.post('deleteOne', { document: true, query: false }, function (doc: IProduct, next) {
	logger.info(`Product deleted successfully: ID ${doc._id}, Name "${doc.name}"`)
	try {
		emitProductDeleted(doc.id)
	} catch (error) {
		logger.error(`Error emitting WebSocket event for deleted Product ID ${doc.id}:`, { error })
	}
	next()
})

productSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	logger.info(`Product deleted successfully: ID ${doc._id}, Name "${doc.name}"`)
	next()
})

productSchema.post('deleteMany', function (result, next) {
	logger.info(`deleteMany on Products completed. Deleted count: ${result.deletedCount}`)
	next()
})

// Compile the schema into a model
const ProductModel = model<IProduct>('Product', productSchema)
export default ProductModel
