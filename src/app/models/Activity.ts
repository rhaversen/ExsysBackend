import { Document, model, Schema } from 'mongoose'

import { transformActivity } from '../controllers/activityController.js' // Import transformer
import { transformKiosk } from '../controllers/kioskController.js'
import logger from '../utils/logger.js'
import { emitActivityDeleted, emitActivityCreated, emitActivityUpdated } from '../webSockets/activityHandlers.js'
import { emitKioskUpdated } from '../webSockets/kioskHandlers.js'

import KioskModel from './Kiosk.js'
import ProductModel, { IProduct } from './Product.js'
import RoomModel, { IRoom } from './Room.js'

// Interfaces
export interface IActivity extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	priorityRooms: Schema.Types.ObjectId[] // Rooms which are promoted for this activity
	disabledProducts: Schema.Types.ObjectId[] // Products that are disabled for this activity
	disabledRooms: Schema.Types.ObjectId[] // Rooms that are disabled for this activity
	name: string

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Internal flag for middleware
	_wasNew?: boolean
}

export interface IActivityFrontend {
	_id: string
	priorityRooms: Array<IRoom['_id']>
	disabledProducts: Array<IProduct['_id']>
	disabledRooms: Array<IRoom['_id']>
	name: string
	createdAt: Date
	updatedAt: Date
}

// Schema
const activitySchema = new Schema<IActivity>({
	priorityRooms: [{
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

activitySchema.path('priorityRooms').validate(async function (v: Schema.Types.ObjectId[]) {
	const foundRooms = await RoomModel.find({ _id: { $in: v } })
	return foundRooms.length === v.length
}, 'Et eller flere spisested findes ikke')

activitySchema.path('priorityRooms').validate(async function (v: Schema.Types.ObjectId[]) {
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
	this._wasNew = this.isNew
	if (this.isNew) {
		logger.debug(`Saving new activity: Name "${this.name}"`)
	} else {
		logger.debug(`Saving updated activity: ID ${this.id}, Name "${this.name}"`)
	}
	next()
})

// Post-save middleware
activitySchema.post('save', async function (doc: IActivity, next) {
	logger.debug(`Activity saved successfully: ID ${doc.id}, Name "${doc.name}"`)
	try {
		const transformedActivity = transformActivity(doc)
		if (doc._wasNew ?? false) {
			emitActivityCreated(transformedActivity)
		} else {
			emitActivityUpdated(transformedActivity)
		}
	} catch (error) {
		logger.error(`Error emitting WebSocket event for Activity ID ${doc.id} in post-save hook:`, { error })
	}
	if (doc._wasNew !== undefined) { delete doc._wasNew } // Clean up
	next()
})

// Pre-delete middleware
activitySchema.pre('deleteOne', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.info('Preparing to delete Activity matching filter:', filter)

	try {
		const docToDelete = await ActivityModel.findOne(filter).select('_id name').lean()

		if (!docToDelete) {
			logger.warn('Pre-deleteOne hook (Activity): No document found matching filter:', filter)
			return next()
		}

		const activityId = docToDelete._id
		logger.info(`Pre-deleteOne hook: Found Activity to delete: ID ${activityId}, Name "${docToDelete.name}"`)

		// Find Kiosks that will be affected BEFORE the update
		const affectedKiosksBeforeUpdate = await KioskModel.find({
			$or: [{ priorityActivities: activityId }, { disabledActivities: activityId }]
		}).lean()

		// Remove activity from Kiosk.priorityActivities and Kiosk.disabledActivities
		logger.debug(`Removing activity ID ${activityId} from Kiosk priorityActivities/disabledActivities`)
		await KioskModel.updateMany(
			{ $or: [{ priorityActivities: activityId }, { disabledActivities: activityId }] },
			{ $pull: { priorityActivities: activityId, disabledActivities: activityId } }
		)
		logger.debug(`Activity ID ${activityId} removal attempt from relevant Kiosks completed`)

		// Emit updates for affected kiosks
		for (const kioskDoc of affectedKiosksBeforeUpdate) {
			const updatedKiosk = await KioskModel.findById(kioskDoc._id) // Re-fetch to get the updated document
			if (updatedKiosk) {
				emitKioskUpdated(await transformKiosk(updatedKiosk))
			}
		}

		next()
	} catch (error) {
		logger.error('Error in pre-deleteOne hook for Activity filter:', { filter, error })
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
			logger.info(`Preparing to delete ${docIds.length} activities via deleteMany: IDs [${docIds.join(', ')}]`)

			// Find Kiosks that will be affected BEFORE the update
			const affectedKiosksBeforeUpdate = await KioskModel.find({
				$or: [{ priorityActivities: { $in: docIds } }, { disabledActivities: { $in: docIds } }]
			}).lean()

			// Remove activities from Kiosk.priorityActivities and Kiosk.disabledActivities
			logger.debug(`Removing activity IDs [${docIds.join(', ')}] from Kiosk priorityActivities/disabledActivities`)
			await KioskModel.updateMany(
				{ $or: [{ priorityActivities: { $in: docIds } }, { disabledActivities: { $in: docIds } }] },
				{ $pull: { priorityActivities: { $in: docIds }, disabledActivities: { $in: docIds } } }
			)
			logger.debug(`Activity IDs [${docIds.join(', ')}] removed from relevant Kiosks`)

			// Emit updates for affected kiosks
			for (const kioskDoc of affectedKiosksBeforeUpdate) {
				const updatedKiosk = await KioskModel.findById(kioskDoc._id) // Re-fetch to get the updated document
				if (updatedKiosk) {
					emitKioskUpdated(await transformKiosk(updatedKiosk))
				}
			}
		} else {
			logger.info('deleteMany on Activities: No documents matched the filter.')
		}
		next()
	} catch (error) {
		logger.error('Error in pre-deleteMany hook for Activities with filter:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteMany hook failed'))
	}
})

// Post-delete middleware (for logging confirmation)
activitySchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	// 'doc' is the deleted document
	logger.info(`Activity deleted successfully: ID ${doc._id}, Name "${doc.name}"`)
	try {
		emitActivityDeleted(doc.id) // Emit with ID
	} catch (error) {
		logger.error(`Error emitting WebSocket event for deleted Activity ID ${doc.id} in post-delete hook:`, { error })
	}
	next()
})

activitySchema.post('deleteMany', function (result, next) {
	logger.info(`deleteMany on Activities completed. Deleted count: ${result.deletedCount}`)
	next()
})

// Compile the schema into a model
const ActivityModel = model<IActivity>('Activity', activitySchema)

// Export the model
export default ActivityModel
