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
	number: number // The number of the room
	description: string // A description of the room
}

// Schema
const roomSchema = new Schema<IRoom>({
	name: {
		type: String,
		required: [true, 'Room name is required']
	},
	number: {
		type: Number,
		required: [true, 'Room number is required'],
		unique: true
	},
	description: {
		type: String,
		required: [true, 'Room description is required']
	}
})

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
