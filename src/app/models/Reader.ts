// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'
import { customAlphabet } from 'nanoid'

// Own modules
import logger from '../utils/logger.js'
import KioskModel from './Kiosk.js'

// Environment variables

// Config variables

// Destructuring and global variables
const nanoidAlphabet = '123465789'
const nanoidLength = 5
const nanoid = customAlphabet(nanoidAlphabet, nanoidLength)

// Interfaces
export interface IReader extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	apiReferenceId: string // Reference to the reader in the API
	readerTag: string // Unique identifier for the reader

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Methods
	comparePassword: (password: string) => Promise<boolean>
	generateNewReaderTag: () => Promise<string>
}

export interface IReaderFrontend {
	_id: string
	readerTag: string
	createdAt: Date
	updatedAt: Date
}

// Schema
const readerSchema = new Schema<IReader>({
	apiReferenceId: {
		type: Schema.Types.String,
		required: true,
		trim: true,
		unique: true
	},
	readerTag: {
		type: Schema.Types.String,
		trim: true,
		unique: true
	}
}, {
	timestamps: true
})

// Validations
readerSchema.path('readerTag').validate(async function (v: string) {
	const foundReaderWithTag = await ReaderModel.findOne({
		readerTag: v,
		_id: { $ne: this._id }
	})
	return foundReaderWithTag === null || foundReaderWithTag === undefined
}, 'Kortlæser tag er allerede i brug')

readerSchema.path('readerTag').validate(function (v: string) {
	return v.length === 5
}, 'Kortlæser tag skal være 5 tegn langt')

readerSchema.path('readerTag').validate(function (v: string) {
	return /^[0-9]+$/.test(v)
}, 'Kortlæser tag kan kun indeholde tal')

readerSchema.path('apiReferenceId').validate(async function (v: string) {
	const foundReaderWithApiReferenceId = await ReaderModel.findOne({
		apiReferenceId: v,
		_id: { $ne: this._id }
	})
	return foundReaderWithApiReferenceId === null || foundReaderWithApiReferenceId === undefined
}, 'ApiReferenceId er allerede i brug')

// Pre-save middleware
readerSchema.pre('save', async function (next) {
	logger.silly('Saving reader')
	if (this.readerTag === undefined) {
		// Set default value to accessToken
		this.readerTag = await generateUniqueReaderTag()
	}
	next()
})

// Pre-delete middleware
readerSchema.pre(['deleteOne', 'findOneAndDelete'], async function (next) {
	const doc = await ReaderModel.findOne(this.getQuery())
	if (doc !== null && doc !== undefined) {
		logger.silly('Removing reader from kiosks with ID:', doc._id)
		// Set readerId to undefined
		await KioskModel.updateMany({ readerId: doc._id }, { $unset: { readerId: '' } })
	}
	next()
})

// Pre-delete-many middleware
readerSchema.pre('deleteMany', async function (next) {
	const docs = await ReaderModel.find(this.getQuery())
	const docIds = docs.map(doc => doc._id)
	if (docIds.length > 0) {
		logger.silly('Removing reader from kiosks with IDs:', docIds)
		// Set readerId to undefined
		await KioskModel.updateMany({ readerId: { $in: docIds } }, { $unset: { readerId: '' } })
	}
	next()
})

// Reader methods
readerSchema.methods.generateNewReaderTag = async function (this: IReader) {
	logger.silly('Generating access token')
	this.readerTag = await generateUniqueReaderTag()
	await this.save()
	return this.readerTag
}

async function generateUniqueReaderTag (): Promise<string> {
	let newReaderTag
	let foundReaderWithTag
	do {
		newReaderTag = nanoid()
		foundReaderWithTag = await ReaderModel.findOne({ readerTag: newReaderTag })
	} while (foundReaderWithTag !== null)
	return newReaderTag
}

// Compile the schema into a model
const ReaderModel = model<IReader>('Reader', readerSchema)

// Export the model
export default ReaderModel
