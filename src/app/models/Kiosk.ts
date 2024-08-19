// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'
import { customAlphabet } from 'nanoid'
import logger from '../utils/logger.js'

// Nanoid setup
const nanoidAlphabet = '123465789'
const nanoidLength = 5
const nanoid = customAlphabet(nanoidAlphabet, nanoidLength)

// Interfaces
export interface IKiosk extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	kioskId: string // Unique identifier generated with nanoid
	activities: Schema.Types.ObjectId[] // Activities the kiosk is responsible for

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Methods
	comparePassword: (password: string) => Promise<boolean>
	generateNewKioskId: () => Promise<string>
}

// Schema
const kioskSchema = new Schema<IKiosk>({
	kioskId: {
		type: Schema.Types.String,
		required: true,
		unique: true
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

// Pre-save middleware
kioskSchema.pre('save', async function (next) {
	logger.silly('Saving kiosk')
	if (this.kioskId === undefined) {
		// Set default value to accessToken
		this.kioskId = await generateUniqueKioskId()
	}
	next()
})

// Kiosk methods
kioskSchema.methods.generateNewKioskId = async function (this: IKiosk) {
	logger.silly('Generating access token')
	this.kioskId = await generateUniqueKioskId()
	await this.save()
	return this.kioskId
}

async function generateUniqueKioskId (): Promise<string> {
	let newKioskId
	let foundKioskWithId
	do {
		newKioskId = nanoid()
		foundKioskWithId = await KioskModel.findOne({ kioskId: newKioskId })
	} while (foundKioskWithId !== null)
	return newKioskId
}

// Compile the schema into a model
const KioskModel = model<IKiosk>('Kiosk', kioskSchema)

// Export the model
export default KioskModel
