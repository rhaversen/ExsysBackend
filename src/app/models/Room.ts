// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'

// Destructuring and global variables

// Interfaces
export interface IRoom extends Document {
	_id: Types.ObjectId
	name: string // The name of the room
	description: string // A description of the room
}

// Schema
const roomSchema = new Schema<IRoom>({
	name: {
		type: String,
		trim: true,
		unique: true,
		required: [true, 'Navn er påkrævet']
	},
	description: {
		type: String,
		trim: true,
		required: [true, 'Beskrivelse er påkrævet']
	}
}, {
	timestamps: true
})

// Validations
roomSchema.path('name').validate(async (v: string) => {
	const foundRoomWithName = await RoomModel.findOne({ name: v })
	return foundRoomWithName === null || foundRoomWithName === undefined
}, 'Navnet er allerede i brug')

// Adding indexes

// Pre-save middleware
roomSchema.pre('save', function (next) {
	logger.silly('Saving order')
	next()
})

// Compile the schema into a model
const RoomModel = model<IRoom>('Room', roomSchema)

// Export the model
export default RoomModel
