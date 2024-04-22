// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'
import { hash } from 'bcrypt'
import validator from 'validator'

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
		trim: true,
		minLength: [2, 'Navn skal være mindst 2 tegn'],
		maxLength: [50, 'Navn kan højest være 50 tegn']
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
		minLength: [5, 'Email skal være mindst 5 tegn'],
		maxLength: [100, 'Email kan højest være 100 tegn']
	},
	password: {
		type: String,
		required: true,
		trim: true,
		minLength: [4, 'Password skal være mindst 8 tegn'],
		maxLength: [100, 'Password kan højest være 100 tegn']
	}
}, {
	timestamps: true
})

// Validations
adminSchema.path('email').validate((v: string) => {
	return validator.isEmail(v)
}, 'Email er ikke gyldig')

adminSchema.path('email').validate(async (v: string) => {
	const foundAdminWithEmail = await AdminModel.findOne({ email: v })
	return foundAdminWithEmail === null || foundAdminWithEmail === undefined
}, 'Email er allerede i brug')

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
