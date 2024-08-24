// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'
import { customAlphabet } from 'nanoid'

// Own modules
import logger from '../utils/logger.js'

// Nanoid setup
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
	const foundReaderWithTag = await ReaderModel.findOne({ readerTag: v, _id: { $ne: this._id } })
	return foundReaderWithTag === null || foundReaderWithTag === undefined
}, 'ReaderTag is already in use')

readerSchema.path('readerTag').validate(function (v: string) {
	return v.length === 5
}, 'ReaderTag must be 5 characters long')

readerSchema.path('readerTag').validate(function (v: string) {
	return /^[0-9]+$/.test(v)
}, 'ReaderTag must only contain numbers')

// Pre-save middleware
// Pre-save middleware
readerSchema.pre('save', async function (next) {
	logger.silly('Saving reader')
	if (this.readerTag === undefined) {
		// Set default value to accessToken
		this.readerTag = await generateUniqueReaderTag()
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
