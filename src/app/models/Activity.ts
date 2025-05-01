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
activitySchema.path('name').validate(async function (v: string) {
	const foundActivityWithName = await ActivityModel.findOne({
		name: v,
		_id: { $ne: this._id }
	})
	return foundActivityWithName === null || foundActivityWithName === undefined
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
activitySchema.pre('save', async function (next) {
	logger.silly('Saving activity')
	next()
})

// Pre-delete middleware
activitySchema.pre(['deleteOne', 'findOneAndDelete'], async function (next) {
	const doc = await ActivityModel.findOne(this.getQuery())
	if (doc !== null && doc !== undefined) {
		logger.silly('Removing activities from kiosks with ID:', doc._id)
		await KioskModel.updateMany({ activities: doc._id }, { $pull: { activities: doc._id } })
	}
	next()
})

// Pre-delete-many middleware
activitySchema.pre('deleteMany', async function (next) {
	const docs = await ActivityModel.find(this.getQuery())
	const docIds = docs.map(doc => doc._id)
	if (docIds.length > 0) {
		logger.silly('Removing activities from kiosks with IDs:', docIds)
		await KioskModel.updateMany({ activities: { $in: docIds } }, { $pull: { activities: { $in: docIds } } })
	}
	next()
})

// Compile the schema into a model
const ActivityModel = model<IActivity>('Activity', activitySchema)

// Export the model
export default ActivityModel
