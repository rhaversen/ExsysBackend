// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'
import { customAlphabet } from 'nanoid'
import ActivityModel from './Activity.js'

// Own modules
import logger from '../utils/logger.js'

// Nanoid setup
const nanoidAlphabet = '123465789'
const nanoidLength = 5
const nanoid = customAlphabet(nanoidAlphabet, nanoidLength)

// Interfaces
export interface IKiosk extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	kioskTag: string // Unique identifier generated with nanoid
	activities: Schema.Types.ObjectId[] // Activities the kiosk is responsible for

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Methods
	comparePassword: (password: string) => Promise<boolean>
	generateNewKioskTag: () => Promise<string>
}

// Schema
const kioskSchema = new Schema<IKiosk>({
	kioskTag: {
		type: Schema.Types.String,
		unique: true,
		trim: true
	},
	activities: {
		type: [Schema.Types.ObjectId],
		ref: 'Activity',
		required: true,
		default: []
	}
}, {
	timestamps: true
})

// Validations
kioskSchema.path('kioskTag').validate(async function (v: string) {
	const foundKioskWithTag = await KioskModel.findOne({ kioskTag: v, _id: { $ne: this._id } })
	return foundKioskWithTag === null || foundKioskWithTag === undefined
}, 'KioskTag is already in use')

kioskSchema.path('kioskTag').validate(function (v: string) {
	return v.length === 5
}, 'KioskTag must be 5 characters long')

kioskSchema.path('kioskTag').validate(function (v: string) {
	return /^[0-9]+$/.test(v)
}, 'KioskTag must only contain numbers')

kioskSchema.path('activities').validate(function (v: Schema.Types.ObjectId[]) {
	return new Set(v).size === v.length
}, 'Activities must be unique')

kioskSchema.path('activities').validate(async function (v: Schema.Types.ObjectId[]) {
	for (const activity of v) {
		const foundActivity = await ActivityModel.findOne({ _id: activity })
		if (foundActivity === null || foundActivity === undefined) {
			return false
		}
	}
	return true
})

// Pre-save middleware
kioskSchema.pre('save', async function (next) {
	logger.silly('Saving kiosk')
	if (this.kioskTag === undefined) {
		// Set default value to accessToken
		this.kioskTag = await generateUniqueKioskTag()
	}
	next()
})

// Kiosk methods
kioskSchema.methods.generateNewKioskTag = async function (this: IKiosk) {
	logger.silly('Generating access token')
	this.kioskTag = await generateUniqueKioskTag()
	await this.save()
	return this.kioskTag
}

async function generateUniqueKioskTag (): Promise<string> {
	let newKioskTag
	let foundKioskWithTag
	do {
		newKioskTag = nanoid()
		foundKioskWithTag = await KioskModel.findOne({ kioskTag: newKioskTag })
	} while (foundKioskWithTag !== null)
	return newKioskTag
}

// Compile the schema into a model
const KioskModel = model<IKiosk>('Kiosk', kioskSchema)

// Export the model
export default KioskModel
