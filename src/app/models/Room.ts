import { type Document, model, Schema } from 'mongoose'

import logger from '../utils/logger.js'

import ActivityModel from './Activity.js'

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
		maxLength: [50, 'Navn kan højest være 50 tegn']
	},
	description: {
		type: Schema.Types.String,
		trim: true,
		required: [true, 'Beskrivelse er påkrævet'],
		maxLength: [50, 'Beskrivelse kan højest være 50 tegn']
	}
}, {
	timestamps: true
})

// Validations
roomSchema.path('name').validate(async function (value: string) {
	logger.silly(`Validating uniqueness for room name: "${value}", Current ID: ${this._id}`)
	const foundRoom = await RoomModel.findOne({ name: value, _id: { $ne: this._id } }).lean()
	if (foundRoom) {
		logger.warn(`Validation failed: Room name "${value}" already exists (ID: ${foundRoom._id})`)
	}
	return !foundRoom
}, 'Navnet er allerede i brug')

// Pre-save middleware
roomSchema.pre('save', function (next) {
	if (this.isNew) {
		logger.debug(`Creating new room: Name "${this.name}"`)
	} else {
		logger.debug(`Updating room: ID ${this.id}, Name "${this.name}"`)
	}
	next()
})

// Post-save middleware
roomSchema.post('save', function (doc, next) {
	logger.debug(`Room saved successfully: ID ${doc.id}, Name "${doc.name}"`)
	next()
})

// Pre-delete middleware
roomSchema.pre('deleteOne', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.info('Preparing to delete Room matching filter:', filter)

	try {
		// Find the document that WILL be deleted to get its ID
		const docToDelete = await RoomModel.findOne(filter).select('_id name').lean()

		if (!docToDelete) {
			logger.warn('Pre-deleteOne hook (Room): No document found matching filter:', filter)
			return next()
		}

		const roomId = docToDelete._id
		logger.info(`Pre-deleteOne hook: Found Room to delete: ID ${roomId}, Name "${docToDelete.name}"`)

		// Remove room from Activity.rooms and Activity.disabledRooms
		logger.debug(`Removing room ID ${roomId} from Activity rooms/disabledRooms`)
		await ActivityModel.updateMany(
			{ $or: [{ rooms: roomId }, { disabledRooms: roomId }] }, // Find activities containing the room in either list
			{ $pull: { rooms: roomId, disabledRooms: roomId } } // Pull from both fields
		)
		logger.debug(`Room ID ${roomId} removal attempt from relevant Activities completed`)

		next()
	} catch (error) {
		logger.error('Error in pre-deleteOne hook for Room filter:', filter, error)
		next(error instanceof Error ? error : new Error('Pre-deleteOne hook failed'))
	}
})

// Pre-delete-many middleware
roomSchema.pre('deleteMany', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.warn('Executing deleteMany on Rooms with filter:', filter)

	try {
		const docsToDelete = await RoomModel.find(filter).select('_id').lean()
		const docIds = docsToDelete.map(doc => doc._id)

		if (docIds.length > 0) {
			logger.info(`Preparing to delete ${docIds.length} rooms via deleteMany: IDs [${docIds.join(', ')}]`)

			// Remove rooms from Activity.rooms and Activity.disabledRooms
			logger.debug(`Removing room IDs [${docIds.join(', ')}] from Activity rooms/disabledRooms`)
			await ActivityModel.updateMany(
				{ $or: [{ rooms: { $in: docIds } }, { disabledRooms: { $in: docIds } }] }, // Find activities containing any of the rooms
				{ $pull: { rooms: { $in: docIds }, disabledRooms: { $in: docIds } } } // Pull from both fields
			)
			logger.debug(`Room IDs [${docIds.join(', ')}] removed from relevant Activities`)
		} else {
			logger.info('deleteMany on Rooms: No documents matched the filter.')
		}
		next()
	} catch (error) {
		logger.error('Error in pre-deleteMany hook for Rooms with filter:', filter, error)
		next(error instanceof Error ? error : new Error('Pre-deleteMany hook failed'))
	}
})

// Post-delete middleware
roomSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	logger.info(`Room deleted successfully: ID ${doc._id}, Name "${doc.name}"`) // Changed level
	next()
})

roomSchema.post('deleteMany', function (result, next) {
	logger.info(`deleteMany on Rooms completed. Deleted count: ${result.deletedCount}`) // Changed level
	next()
})

// Compile the schema into a model
const RoomModel = model<IRoom>('Room', roomSchema)

// Export the model
export default RoomModel
