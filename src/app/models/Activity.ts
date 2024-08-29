// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'
import logger from '../utils/logger.js'
import RoomModel from './Room.js'
import KioskModel from './Kiosk.js'

// Interfaces
export interface IActivity extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	roomId: Schema.Types.ObjectId | null // Where the activity is dining
	name: string

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

// Schema
const activitySchema = new Schema<IActivity>({
	roomId: {
		type: Schema.Types.ObjectId,
		ref: 'Room'
	},
	name: {
		type: Schema.Types.String,
		required: true,
		trim: true,
		unique: true,
		maxlength: [50, 'Navn kan højest være 50 tegn']
	}
}, {
	timestamps: true
})

// Validations
activitySchema.path('name').validate(async function (v: string) {
	const foundActivityWithName = await ActivityModel.findOne({ name: v, _id: { $ne: this._id } })
	return foundActivityWithName === null || foundActivityWithName === undefined
}, 'Navnet er allerede i brug')

activitySchema.path('roomId').validate(async function (v: Schema.Types.ObjectId) {
	if (v === null || v === undefined) return true
	const foundRoom = await RoomModel.findOne({ _id: v })
	return foundRoom !== null && foundRoom !== undefined
}, 'Rummet findes ikke')

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
