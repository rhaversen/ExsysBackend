import { compare, hash } from 'bcrypt'
import { type Document, model, Schema } from 'mongoose'

import logger from '../utils/logger.js'
import config from '../utils/setupConfig.js'

// Config variables
const { bcryptSaltRounds } = config

export interface IAdmin extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	name: string
	password: string

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Methods
	comparePassword: (password: string) => Promise<boolean>
}

export interface IAdminFrontend {
	_id: string
	name: string
	createdAt: Date
	updatedAt: Date
}

// Schema
const adminSchema = new Schema<IAdmin>({
	name: {
		type: Schema.Types.String,
		trim: true,
		required: true,
		unique: true,
		maxLength: [50, 'Navn kan højest være 50 tegn']
	},
	password: {
		type: Schema.Types.String,
		required: true,
		trim: true,
		minlength: [4, 'Password skal være mindst 4 tegn'],
		maxLength: [100, 'Password kan højest være 100 tegn']
	}
}, {
	timestamps: true
})

// Validations
adminSchema.path('name').validate(async function (value: string) {
	logger.silly(`Validating uniqueness for admin name: "${value}", Current ID: ${this._id}`)
	const foundAdmin = await AdminModel.findOne({ name: value, _id: { $ne: this._id } }).lean()
	if (foundAdmin) {
		logger.warn(`Validation failed: Admin name "${value}" already exists (ID: ${foundAdmin._id})`)
	}
	return !foundAdmin
}, 'Navnet er allerede i brug')

// Pre-save middleware for hashing password
adminSchema.pre('save', async function (next) {
	// Only hash the password if it has been modified (or is new)
	if (!this.isModified('password')) {
		logger.silly(`Admin ID ${this.id}: Password not modified, skipping hash.`)
		return next()
	}

	try {
		logger.debug(`Admin ID ${this.id}: Hashing new/modified password.`)
		const hashedPassword = await hash(this.password, bcryptSaltRounds)
		this.password = hashedPassword
		logger.silly(`Admin ID ${this.id}: Password hashed successfully.`)
		next()
	} catch (error) {
		logger.error(`Admin ID ${this.id}: Error hashing password`, error)
		// Pass error to Mongoose to halt save operation
		next(error instanceof Error ? error : new Error('Password hashing failed'))
	}
})

// Post-save middleware
adminSchema.post('save', function (doc, next) {
	// Avoid logging password hash here
	logger.debug(`Admin saved successfully: ID ${doc.id}, Name "${doc.name}"`)
	next()
})

// Pre-delete middleware (if any cascading logic needed, e.g., logging out sessions)
adminSchema.pre(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, async function (next) {
	// 'this' refers to the document being deleted
	logger.info(`Preparing to delete admin: ID ${this._id}, Name "${this.name}"`) // Changed level
	// Add logic here if needed, e.g., invalidate sessions associated with this admin ID
	// Example: await SessionModel.deleteMany({ 'session.passport.user': this._id });
	next()
})

// Post-delete middleware
adminSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	logger.info(`Admin deleted successfully: ID ${doc._id}, Name "${doc.name}"`) // Changed level
	next()
})

// Admin methods
adminSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
	logger.debug(`Comparing provided password for admin: ID ${this.id}, Name "${this.name}"`)
	try {
		const isMatch = await compare(password, this.password)
		logger.silly(`Password comparison result for admin ID ${this.id}: ${isMatch}`)
		return isMatch
	} catch (error) {
		logger.error(`Error comparing password for admin ID ${this.id}`, error)
		return false // Return false on error
	}
}

// Compile the schema into a model
const AdminModel = model<IAdmin>('Admin', adminSchema)

// Export the model
export default AdminModel
