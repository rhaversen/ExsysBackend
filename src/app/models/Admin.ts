// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'
import { compare, hash } from 'bcrypt'

// Own modules
import logger from '../utils/logger.js'
import config from '../utils/setupConfig.js'

// Destructuring and global variables
const {
	bcryptSaltRounds
} = config

// Interfaces
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

// Schema
const adminSchema = new Schema<IAdmin>({
	name: {
		type: Schema.Types.String,
		trim: true,
		required: true,
		unique: true,
		maxlength: [50, 'Navn kan højest være 50 tegn']
	},
	password: {
		type: Schema.Types.String,
		required: true,
		trim: true,
		minlength: [4, 'Password skal være mindst 4 tegn'],
		maxlength: [100, 'Password kan højest være 100 tegn']
	}
}, {
	timestamps: true
})

// Validations
adminSchema.path('name').validate(async function (v: string) {
	const foundAdminWithName = await AdminModel.findOne({ name: v, _id: { $ne: this._id } })
	return foundAdminWithName === null || foundAdminWithName === undefined
}, 'Navnet er allerede i brug')

// Adding indexes

// Pre-save middleware
adminSchema.pre('save', async function (next) {
	logger.silly('Saving admin')

	// Password hashing
	if (this.isModified('password')) {
		this.password = await hash(this.password, bcryptSaltRounds) // Using a random salt for each user
	}
	next()
})

adminSchema.methods.comparePassword = async function (this: IAdmin, password: string): Promise<boolean> {
	logger.silly('Comparing password')
	const isPasswordCorrect = await compare(password, this.password)
	return isPasswordCorrect
}

// Compile the schema into a model
const AdminModel = model<IAdmin>('Admin', adminSchema)

// Export the model
export default AdminModel
