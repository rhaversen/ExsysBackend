import { type Document, type FlattenMaps, model, Schema, Types } from 'mongoose'
import { customAlphabet } from 'nanoid'

import { transformKiosk } from '../controllers/kioskController.js' // Import transformer
import logger from '../utils/logger.js'
import { emitKioskCreated, emitKioskDeleted, emitKioskUpdated } from '../webSockets/kioskHandlers.js'

import ActivityModel, { IActivityFrontend } from './Activity.js'
import ReaderModel, { IReaderFrontend } from './Reader.js'

const nanoidAlphabet = '123465789'
const nanoidLength = 5
const nanoid = customAlphabet(nanoidAlphabet, nanoidLength)

// Interfaces
export interface IKiosk extends Document {
	// Properties
	_id: Types.ObjectId
	name: string // Name of the kiosk
	kioskTag: string // Unique identifier generated with nanoid
	enabledActivities: Schema.Types.ObjectId[] | [] // Activities that are enabled for this kiosk
	readerId: Schema.Types.ObjectId | undefined // The pay station the kiosk is connected to
	deactivated: boolean; // true: Deactivated until manually activated, false: use deactivatedUntil date if set
	deactivatedUntil: Date | null; // null: active, Date: deactivated until that date (when deactivated is false)

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Internal flag for middleware
	_wasNew?: boolean

	// Methods
	generateNewKioskTag: () => Promise<string>
}

export interface IKioskFrontend {
	_id: string
	name: string
	kioskTag: string
	readerId: IReaderFrontend['_id'] | null
	enabledActivities: Array<IActivityFrontend['_id']>
	deactivatedUntil: string | null
	deactivated: boolean
	createdAt: Date
	updatedAt: Date
}

// Schema
const kioskSchema = new Schema<IKiosk>({
	name: {
		type: Schema.Types.String,
		required: true,
		trim: true,
		maxLength: [50, 'Navn kan højest være 50 tegn']
	},
	kioskTag: {
		type: Schema.Types.String,
		trim: true,
		unique: true
	},
	readerId: {
		type: Schema.Types.ObjectId,
		ref: 'Reader',
		default: null
	},
	enabledActivities: [{
		type: Schema.Types.ObjectId,
		ref: 'Activity',
		default: []
	}],
	deactivated: {
		type: Schema.Types.Boolean,
		default: false
	},
	deactivatedUntil: {
		type: Schema.Types.Date,
		default: null
	}
}, {
	timestamps: true
})

// Validations
kioskSchema.path('kioskTag').validate(async function (value: string) {
	logger.silly(`Validating uniqueness for kioskTag: "${value}", Current ID: ${this._id}`)
	const foundKiosk = await KioskModel.findOne({ kioskTag: value, _id: { $ne: this._id } }).lean()
	if (foundKiosk) {
		logger.warn(`Validation failed: kioskTag "${value}" already exists (ID: ${foundKiosk._id})`)
	}
	return !foundKiosk
}, 'Kiosk tag er allerede i brug')

kioskSchema.path('kioskTag').validate(function (v: string) {
	return v.length === 5
}, 'KioskTag skal mindst være 5 tegn')

kioskSchema.path('kioskTag').validate(function (v: string) {
	return /^[0-9]+$/.test(v)
}, 'KioskTag kan kun indeholde tal')

kioskSchema.path('readerId').validate(async function (value: Schema.Types.ObjectId) {
	if (value === undefined || value === null) { return true }
	logger.silly(`Validating existence for readerId: "${value}", Kiosk ID: ${this._id}`)
	const foundReader = await ReaderModel.findById(value).lean()
	if (!foundReader) {
		logger.warn(`Validation failed: readerId "${value}" does not exist. Kiosk ID: ${this._id}`)
	}
	return !!foundReader
}, 'Den valgte kortlæser findes ikke')

kioskSchema.path('enabledActivities').validate(async function (v: Schema.Types.ObjectId[]) {
	for (const activity of v) {
		const foundActivity = await ActivityModel.findOne({ _id: activity })
		if (foundActivity === null || foundActivity === undefined) {
			return false
		}
	}
	return true
}, 'En eller flere aktiviteter findes ikke')

kioskSchema.path('readerId').validate(async function (v: Schema.Types.ObjectId) {
	if (v === undefined || v === null) { return true }
	const foundKioskWithReader = await KioskModel.findOne({
		readerId: v,
		_id: { $ne: this._id }
	})
	return foundKioskWithReader === null || foundKioskWithReader === undefined
}, 'Kortlæser er allerede tildelt en kiosk')

// Pre-save middleware for generating kioskTag
kioskSchema.pre('save', async function (next) {
	this._wasNew = this.isNew // Set _wasNew flag

	if (this.isNew) {
		logger.debug(`Creating new kiosk: Name "${this.name}"`)
		if (!this.kioskTag) { // Generate tag only if not provided and is new
			try {
				this.kioskTag = await generateUniqueKioskTag()
				logger.debug(`Generated unique kioskTag "${this.kioskTag}" for new kiosk "${this.name}"`)
			} catch (error) {
				logger.error(`Failed to generate unique kioskTag for new kiosk "${this.name}"`, { error })
				return next(error instanceof Error ? error : new Error('Kiosk tag generation failed'))
			}
		}
	}
	next()
})

// Post-save middleware
kioskSchema.post('save', async function (doc: IKiosk, next) {
	logger.debug(`Kiosk saved successfully: ID ${doc.id}, Name "${doc.name}", Tag "${doc.kioskTag}"`)
	try {
		const transformed = transformKiosk(doc)
		if (doc._wasNew ?? false) {
			emitKioskCreated(transformed)
		} else {
			emitKioskUpdated(transformed)
		}
	} catch (error) {
		logger.error(`Error emitting WebSocket event for Kiosk ID ${doc.id} in post-save hook:`, { error })
	}
	if (doc._wasNew !== undefined) { delete doc._wasNew } // Clean up
	next()
})

// Pre-delete middleware (single document)
kioskSchema.pre(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, async function (next) {
	// 'this' refers to the document being deleted
	const kioskId = this._id
	logger.info(`Preparing to delete kiosk: ID ${kioskId}, Name "${this.name}", Tag "${this.kioskTag}"`)
	next()
})

// Pre-delete-many middleware (query-based)
kioskSchema.pre('deleteMany', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.warn('Executing deleteMany on Kiosks with filter:', filter)
	next()
})

// Post-delete middleware
kioskSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	logger.info(`Kiosk deleted successfully: ID ${doc._id}, Name "${doc.name}", Tag "${doc.kioskTag}"`)
	try {
		emitKioskDeleted(doc.id) // Emit with ID
	} catch (error) {
		logger.error(`Error emitting WebSocket event for deleted Kiosk ID ${doc.id} in post-delete hook:`, { error })
	}
	next()
})

kioskSchema.post('deleteMany', function (result, next) {
	logger.info(`deleteMany on Kiosks completed. Deleted count: ${result.deletedCount}`)
	next()
})

// Kiosk methods
kioskSchema.methods.generateNewKioskTag = async function (this: IKiosk): Promise<string> {
	const oldTag = this.kioskTag
	logger.info(`Generating new kioskTag for kiosk: ID ${this.id}, Old Tag: ${oldTag}`)
	try {
		this.kioskTag = await generateUniqueKioskTag()
		await this.save() // Save the kiosk with the new tag
		logger.info(`New kioskTag "${this.kioskTag}" generated and saved for kiosk ID ${this.id}`)
		return this.kioskTag
	} catch (error) {
		logger.error(`Failed to generate and save new kioskTag for kiosk ID ${this.id}`, { error })
		throw error // Re-throw error
	}
}

// Helper function for generating unique tag
async function generateUniqueKioskTag (): Promise<string> {
	let attempts = 0
	const maxAttempts = 10 // Prevent infinite loop
	let newKioskTag: string
	let foundKioskWithTag: FlattenMaps<IKiosk> | null

	logger.silly('Attempting to generate a unique kioskTag...')
	do {
		if (attempts >= maxAttempts) {
			logger.error(`Failed to generate a unique kioskTag after ${maxAttempts} attempts.`)
			throw new Error('Could not generate unique kiosk tag')
		}
		newKioskTag = nanoid()
		logger.silly(`Generated candidate kioskTag: ${newKioskTag} (Attempt ${attempts + 1})`)
		foundKioskWithTag = await KioskModel.findOne({ kioskTag: newKioskTag }).lean()
		attempts++
	} while (foundKioskWithTag !== null)

	logger.debug(`Unique kioskTag generated: ${newKioskTag} after ${attempts} attempts.`)
	return newKioskTag
}

// Compile the schema into a model
const KioskModel = model<IKiosk>('Kiosk', kioskSchema)

// Export the model
export default KioskModel
