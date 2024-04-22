// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'
import { hash } from 'bcrypt'

// Own modules
import logger from '../utils/logger.js'
import config from '../utils/setupConfig.js'

// Destructuring and global variables
const {
	bcryptSaltRounds
} = config

// Interfaces
export interface IAdmin extends Document {
	_id: Types.ObjectId
	name: string
	email: string
	password: string
}

// Schema
const adminSchema = new Schema<IAdmin>({
	name: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true
	},
	password: {
		type: String,
		required: true,
		trim: true
	}
}, {
	timestamps: true
})

// Adding indexes

// Pre-save middleware
adminSchema.pre('save', async function (next) {
	logger.silly('Saving admin')

	// Password hashing
	if (this.isModified('password')) {
		this.password = await hash(this.password, bcryptSaltRounds) // Using a random salt for each user
		next()
	}
})

// Compile the schema into a model
const AdminModel = model<IAdmin>('Admin', adminSchema)

// Export the model
export default AdminModel
