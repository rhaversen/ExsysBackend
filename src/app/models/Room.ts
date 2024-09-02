// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import ActivityModel from './Activity.js'

// Destructuring and global variables

// Interfaces
export interface IRoom extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	name: string // The name of the room
	description: string // A description of the room

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

// Schema
const roomSchema = new Schema<IRoom>({
	name: {
		type: Schema.Types.String,
		trim: true,
		unique: true,
		required: [true, 'Navn er påkrævet'],
		maxlength: [50, 'Navn kan højest være 50 tegn']
	},
	description: {
		type: Schema.Types.String,
		trim: true,
		required: [true, 'Beskrivelse er påkrævet'],
		maxlength: [50, 'Beskrivelse kan højest være 50 tegn']
	}
}, {
	timestamps: true
})

// Validations
roomSchema.path('name').validate(async function (v: string) {
	const foundRoomWithName = await RoomModel.findOne({
		name: v,
		_id: { $ne: this._id }
	})
	return foundRoomWithName === null || foundRoomWithName === undefined
}, 'Navnet er allerede i brug')

// Adding indexes

// Pre-save middleware
roomSchema.pre('save', function (next) {
	logger.silly('Saving room')
	next()
})

// Pre-delete middleware
roomSchema.pre(['deleteOne', 'findOneAndDelete'], async function (next) {
	const doc = await this.model.findOne(this.getQuery())
	if (doc !== null && doc !== undefined) {
		logger.silly('Removing room from activities with ID:', doc._id)
		// Set roomId to undefined by using $unset
		await ActivityModel.updateMany({ roomId: doc._id }, { $unset: { roomId: '' } })
	}
	next()
})

// Pre-delete-many middleware
roomSchema.pre('deleteMany', async function (next) {
	const docs = await this.model.find(this.getQuery())
	const docIds = docs.map(doc => doc._id)
	if (docIds.length > 0) {
		logger.silly('Removing room from activities with IDs:', docIds)
		// Set roomId to undefined by using $unset
		await ActivityModel.updateMany({ roomId: { $in: docIds } }, { $unset: { roomId: '' } })
	}
	next()
})

// Compile the schema into a model
const RoomModel = model<IRoom>('Room', roomSchema)

// Export the model
export default RoomModel
