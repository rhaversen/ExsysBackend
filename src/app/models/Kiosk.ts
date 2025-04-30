// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'
import { customAlphabet } from 'nanoid'

// Own modules
import logger from '../utils/logger.js'
import ReaderModel from './Reader.js'
import ActivityModel from './Activity.js'

// Environment variables

// Config variables

// Destructuring and global variables
const nanoidAlphabet = '123465789'
const nanoidLength = 5
const nanoid = customAlphabet(nanoidAlphabet, nanoidLength)

// Interfaces
export interface IKiosk extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	name: string // Name of the kiosk
	kioskTag: string // Unique identifier generated with nanoid
	activities: Schema.Types.ObjectId[] | [] // Promoted activities for this kiosk
	disabledActivities: Schema.Types.ObjectId[] | [] // Activities that are disabled for this kiosk
	readerId: Schema.Types.ObjectId | undefined // The pay station the kiosk is connected to
	deactivated: boolean; // true: Deactivated until manually activated, false: use deactivatedUntil date if set
	deactivatedUntil: Date | null; // null: active, Date: deactivated until that date (when deactivated is false)

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Methods
	generateNewKioskTag: () => Promise<string>
}

export interface IKioskFrontend {
	_id: string
	name: string
	kioskTag: string
	activities: Schema.Types.ObjectId[] | string[]
	disabledActivities: Schema.Types.ObjectId[] | string[]
	readerId: Schema.Types.ObjectId | string[] | undefined
	deactivated: boolean;
	deactivatedUntil: Date | null;
	createdAt: Date
	updatedAt: Date
}

// Schema
const kioskSchema = new Schema<IKiosk>({
	name: {
		type: Schema.Types.String,
		required: true,
		trim: true,
		maxlength: [50, 'Navn kan højest være 50 tegn']
	},
	kioskTag: {
		type: Schema.Types.String,
		unique: true,
		trim: true
	},
	readerId: {
		type: Schema.Types.ObjectId,
		ref: 'Reader'
	},
	activities: {
		type: [Schema.Types.ObjectId],
		ref: 'Activity',
		default: []
	},
	disabledActivities: {
		type: [Schema.Types.ObjectId],
		ref: 'Activity',
		default: []
	},
	deactivated: {
		type: Boolean,
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
kioskSchema.path('kioskTag').validate(async function (v: string) {
	const foundKioskWithTag = await KioskModel.findOne({
		kioskTag: v,
		_id: { $ne: this._id }
	})
	return foundKioskWithTag === null || foundKioskWithTag === undefined
}, 'KioskTag er allerede i brug')

kioskSchema.path('kioskTag').validate(function (v: string) {
	return v.length === 5
}, 'KioskTag skal mindst være 5 tegn')

kioskSchema.path('kioskTag').validate(function (v: string) {
	return /^[0-9]+$/.test(v)
}, 'KioskTag kan kun indeholde tal')

kioskSchema.path('readerId').validate(async function (v: Schema.Types.ObjectId) {
	if (v === undefined || v === null) return true
	const foundReader = await ReaderModel.findOne({ _id: v })
	return foundReader !== null && foundReader !== undefined
}, 'Kortlæseren findes ikke')

kioskSchema.path('activities').validate(async function (v: Schema.Types.ObjectId[]) {
	for (const activity of v) {
		const foundActivity = await ActivityModel.findOne({ _id: activity })
		if (foundActivity === null || foundActivity === undefined) {
			return false
		}
	}
	return true
}, 'En eller flere aktiviteter findes ikke')

kioskSchema.path('readerId').validate(async function (v: Schema.Types.ObjectId) {
	if (v === undefined || v === null) return true
	const foundKioskWithReader = await KioskModel.findOne({
		readerId: v,
		_id: { $ne: this._id }
	})
	return foundKioskWithReader === null || foundKioskWithReader === undefined
}, 'Kortlæser er allerede tildelt en kiosk')

kioskSchema.path('disabledActivities').validate(async function (v: Schema.Types.ObjectId[]) {
	for (const activity of v) {
		const foundActivity = await ActivityModel.findOne({ _id: activity })
		if (foundActivity === null || foundActivity === undefined) {
			return false
		}
	}
	return true
}, 'En eller flere deaktiverede aktiviteter findes ikke')

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
