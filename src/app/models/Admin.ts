// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'
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
	name: string
	email: string
	password: string
	createdAt: Date
	updatedAt: Date
}

// Schema
const adminSchema = new Schema<IAdmin>({
	name: {
		type: Schema.Types.String,
		trim: true,
		minLength: [2, 'Navn skal være mindst 2 tegn'],
		maxLength: [50, 'Navn kan højest være 50 tegn']
	},
	email: {
		type: Schema.Types.String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
		minLength: [5, 'Email skal være mindst 5 tegn'],
		maxLength: [100, 'Email kan højest være 100 tegn']
	},
	password: {
		type: Schema.Types.String,
		required: true,
		trim: true,
		unique: true,
		minLength: [4, 'Password skal være mindst 8 tegn'],
		maxLength: [100, 'Password kan højest være 100 tegn']
	}
}, {
	timestamps: true
})

// Validations
adminSchema.path('email').validate(function (v: string) {
	return validator.isEmail(v)
}, 'Email er ikke gyldig')

adminSchema.path('email').validate(async function (v: string) {
	const foundAdminWithEmail = await AdminModel.findOne({ email: v, _id: { $ne: this._id } })
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
