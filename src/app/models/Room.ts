// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'

// Destructuring and global variables

// Interfaces
export interface IRoom extends Document {
	_id: Types.ObjectId
	roomName: string // The name of the room
	roomNumber: number // The number of the room
}

// Schema
const roomSchema = new Schema<IRoom>({
	roomName: {
		type: String,
		required: [true, 'Room name is required']
	},
	roomNumber: {
		type: Number,
		required: [true, 'Room number is required'],
		unique: true
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
