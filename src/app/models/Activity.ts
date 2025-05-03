import { type Document, model, Schema } from 'mongoose'

import logger from '../utils/logger.js'

import KioskModel from './Kiosk.js'
import ProductModel, { IProduct } from './Product.js'
import RoomModel, { IRoom } from './Room.js'

// Interfaces
export interface IActivity extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	rooms: Schema.Types.ObjectId[] | IRoom[] // Rooms which are promoted for this activity
	disabledProducts: Schema.Types.ObjectId[] | IProduct[] // Products that are disabled for this activity
	disabledRooms: Schema.Types.ObjectId[] | IRoom[] // Rooms that are disabled for this activity
	name: string

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

export interface IActivityPopulated extends IActivity {
	rooms: IRoom[]
	disabledProducts: IProduct[]
}

// Schema
const activitySchema = new Schema<IActivity>({
	rooms: [{
		type: Schema.Types.ObjectId,
		ref: 'Room',
		default: []
	}],
	name: {
		type: Schema.Types.String,
		required: true,
		trim: true,
		unique: true,
		maxLength: [50, 'Navn kan højest være 50 tegn']
	},
	disabledProducts: [{
		type: Schema.Types.ObjectId,
		ref: 'Product',
		default: []
	}],
	disabledRooms: [{
		type: Schema.Types.ObjectId,
		ref: 'Room',
		default: []
	}]
}, {
	timestamps: true
})

// Validations
activitySchema.path('name').validate(async function (value: string) {
	logger.silly(`Validating uniqueness for activity name: "${value}", Current ID: ${this._id}`)
	const foundActivity = await ActivityModel.findOne({ name: value, _id: { $ne: this._id } }).lean()
	if (foundActivity) {
		logger.warn(`Validation failed: Activity name "${value}" already exists (ID: ${foundActivity._id})`)
	}
	return !foundActivity
}, 'Navnet er allerede i brug')

activitySchema.path('rooms').validate(async function (v: Schema.Types.ObjectId[]) {
	const foundRooms = await RoomModel.find({ _id: { $in: v } })
	return foundRooms.length === v.length
}, 'Et eller flere spisested findes ikke')

activitySchema.path('rooms').validate(async function (v: Schema.Types.ObjectId[]) {
	const uniqueRooms = new Set(v)
	return uniqueRooms.size === v.length
}, 'Spisestederne skal være unikke')

activitySchema.path('disabledProducts').validate(async function (v: Schema.Types.ObjectId[]) {
	const foundProducts = await ProductModel.find({ _id: { $in: v } })
	return foundProducts.length === v.length
}, 'Et eller flere produkter findes ikke')

activitySchema.path('disabledProducts').validate(async function (v: Schema.Types.ObjectId[]) {
	const uniqueProducts = new Set(v)
	return uniqueProducts.size === v.length
}, 'Produkterne skal være unikke')

activitySchema.path('disabledRooms').validate(async function (v: Schema.Types.ObjectId[]) {
	const foundRooms = await RoomModel.find({ _id: { $in: v } })
	return foundRooms.length === v.length
}, 'Et eller flere deaktiverede spisesteder findes ikke')

activitySchema.path('disabledRooms').validate(async function (v: Schema.Types.ObjectId[]) {
	const uniqueRooms = new Set(v)
	return uniqueRooms.size === v.length
}, 'De deaktiverede spisesteder skal være unikke')

// Pre-save middleware
activitySchema.pre('save', function (next) {
	// Log before saving, especially useful for tracking updates vs creates
	if (this.isNew) {
		logger.debug(`Saving new activity: Name "${this.name}"`)
	} else {
		logger.debug(`Saving updated activity: ID ${this.id}, Name "${this.name}"`)
	}
	next()
})

// Post-save middleware
activitySchema.post('save', function (doc, next) {
	logger.debug(`Activity saved successfully: ID ${doc.id}, Name "${doc.name}"`)
	next()
})

// Pre-delete middleware
activitySchema.pre('deleteOne', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.info('Preparing to delete Activity matching filter:', filter)

	try {
		// Find the document that WILL be deleted to get its ID
		const docToDelete = await ActivityModel.findOne(filter).select('_id name').lean()

		if (!docToDelete) {
			logger.warn('Pre-deleteOne hook (Activity): No document found matching filter:', filter)
			return next() // Document might have been deleted already
		}

		const activityId = docToDelete._id
		logger.info(`Pre-deleteOne hook: Found Activity to delete: ID ${activityId}, Name "${docToDelete.name}"`)

		// Remove activity from Kiosk.activities and Kiosk.disabledActivities
		logger.debug(`Removing activity ID ${activityId} from Kiosk activities/disabledActivities`)
		await KioskModel.updateMany(
			{ $or: [{ activities: activityId }, { disabledActivities: activityId }] }, // Find kiosks containing the activity in either list
			{ $pull: { activities: activityId, disabledActivities: activityId } } // Pull from both fields
		)
		logger.debug(`Activity ID ${activityId} removal attempt from relevant Kiosks completed`)
		next()
	} catch (error) {
		logger.error('Error in pre-deleteOne hook for Activity filter:', filter, error)
		// Pass the error to the next middleware
		next(error instanceof Error ? error : new Error('Pre-deleteOne hook failed'))
	}
})

// Pre-delete-many middleware (query-based)
activitySchema.pre('deleteMany', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.warn('Executing deleteMany on Activities with filter:', filter)

	try {
		const docsToDelete = await ActivityModel.find(filter).select('_id').lean()
		const docIds = docsToDelete.map(doc => doc._id)

		if (docIds.length > 0) {
			logger.info(`Preparing to delete ${docIds.length} activities: IDs [${docIds.join(', ')}]`)

			// Remove activities from Kiosk.activities and Kiosk.disabledActivities
			logger.debug(`Removing activity IDs [${docIds.join(', ')}] from Kiosk activities/disabledActivities`)
			await KioskModel.updateMany(
				{ $or: [{ activities: { $in: docIds } }, { disabledActivities: { $in: docIds } }] }, // Find kiosks containing any of the activities
				{ $pull: { activities: { $in: docIds }, disabledActivities: { $in: docIds } } } // Pull from both fields
			)
			logger.debug(`Activity IDs [${docIds.join(', ')}] removed from relevant Kiosks`)
		} else {
			logger.info('deleteMany on Activities: No documents matched the filter.')
		}
		next()
	} catch (error) {
		logger.error('Error in pre-deleteMany hook for Activities with filter:', filter, error)
		next(error instanceof Error ? error : new Error('Pre-deleteMany hook failed'))
	}
})

// Post-delete middleware (for logging confirmation)
activitySchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	// 'doc' is the deleted document
	logger.info(`Activity deleted successfully: ID ${doc._id}, Name "${doc.name}"`) // Changed level
	next()
})

activitySchema.post('deleteMany', function (result, next) {
	logger.info(`deleteMany on Activities completed. Deleted count: ${result.deletedCount}`) // Changed level
	next()
})

// Compile the schema into a model
const ActivityModel = model<IActivity>('Activity', activitySchema)

// Export the model
export default ActivityModel
