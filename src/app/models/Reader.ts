import { type Document, type FlattenMaps, model, Schema, Types } from 'mongoose'
import { customAlphabet } from 'nanoid'

import { transformKiosk } from '../controllers/kioskController.js'
import { transformReader } from '../controllers/readerController.js' // Import transformer
import logger from '../utils/logger.js'
import { emitKioskUpdated } from '../webSockets/kioskHandlers.js'
import { emitReaderCreated, emitReaderDeleted, emitReaderUpdated } from '../webSockets/readerHandlers.js'

import KioskModel from './Kiosk.js'

const nanoidAlphabet = '123465789'
const nanoidLength = 5
const nanoid = customAlphabet(nanoidAlphabet, nanoidLength)

// Interfaces
export interface IReader extends Document {
	// Properties
	_id: Types.ObjectId
	apiReferenceId: string // Reference to the reader in the API
	readerTag: string // Unique identifier for the reader

	// Timestamps
	createdAt: Date
	updatedAt: Date

	// Methods
	generateNewReaderTag: () => Promise<string>

	// Internal flag for middleware
	_wasNew?: boolean
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
		unique: true,
		index: true
	},
	readerTag: {
		type: Schema.Types.String,
		trim: true,
		unique: true,
		index: true
	}
}, {
	timestamps: true
})

// Validations
readerSchema.path('readerTag').validate(async function (value: string) {
	logger.silly(`Validating uniqueness for readerTag: "${value}", Current ID: ${this._id}`)
	const foundReader = await ReaderModel.findOne({ readerTag: value, _id: { $ne: this._id } }).lean()
	if (foundReader) {
		logger.warn(`Validation failed: readerTag "${value}" already exists (ID: ${foundReader._id})`)
	}
	return !foundReader
}, 'Kortlæser tag er allerede i brug')

readerSchema.path('readerTag').validate(function (value: string) {
	return value.length === 5
}, 'Kortlæser tag skal være 5 tegn langt')

readerSchema.path('readerTag').validate(function (value: string) {
	return /^[0-9]+$/.test(value)
}, 'Kortlæser tag kan kun indeholde tal')

readerSchema.path('apiReferenceId').validate(async function (value: string) {
	logger.silly(`Validating uniqueness for apiReferenceId: "${value}", Current ID: ${this._id}`)
	const foundReader = await ReaderModel.findOne({ apiReferenceId: value, _id: { $ne: this._id } }).lean()
	if (foundReader) {
		logger.warn(`Validation failed: apiReferenceId "${value}" already exists (ID: ${foundReader._id})`)
	}
	return !foundReader
}, 'ApiReferenceId er allerede i brug')

// Pre-save middleware
readerSchema.pre('save', async function (next) {
	this._wasNew = this.isNew // Set _wasNew flag
	if (this.isNew) {
		logger.debug(`Creating new reader: API Ref "${this.apiReferenceId}"`)
		if (this.readerTag === undefined || this.readerTag === null || this.readerTag === '') {
			try {
				this.readerTag = await generateUniqueReaderTag()
				logger.debug(`Generated unique readerTag "${this.readerTag}" for new reader API Ref "${this.apiReferenceId}"`)
			} catch (error) {
				logger.error(`Failed to generate unique readerTag for new reader API Ref "${this.apiReferenceId}"`, { error })
				return next(error instanceof Error ? error : new Error('Reader tag generation failed'))
			}
		}
	} else {
		logger.debug(`Updating reader: ID ${this.id}, API Ref "${this.apiReferenceId}", Tag "${this.readerTag}"`)
	}
	next()
})

// Post-save middleware
readerSchema.post('save', function (doc: IReader, next) {
	logger.debug(`Reader saved successfully: ID ${doc.id}, API Ref ID ${doc.apiReferenceId}`)
	try {
		const transformedReader = transformReader(doc)
		if (doc._wasNew ?? false) {
			emitReaderCreated(transformedReader)
		} else {
			emitReaderUpdated(transformedReader)
		}
	} catch (error) {
		logger.error(`Error emitting WebSocket event for Reader ID ${doc.id} in post-save hook:`, { error })
	}
	if (doc._wasNew !== undefined) { delete doc._wasNew } // Clean up
	next()
})

// Pre-delete middleware
readerSchema.pre('deleteOne', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.info('Preparing to delete Reader matching filter:', filter)

	try {
		// Find the document that WILL be deleted to get its ID
		const docToDelete = await ReaderModel.findOne(filter).select('_id apiReferenceId readerTag').lean()

		if (!docToDelete) {
			logger.warn('Pre-deleteOne hook (Reader): No document found matching filter:', filter)
			return next()
		}

		const readerId = docToDelete._id
		logger.info(`Pre-deleteOne hook: Found Reader to delete: ID ${readerId}, API Ref "${docToDelete.apiReferenceId}", Tag "${docToDelete.readerTag}"`)

		// Find kiosks that will be affected BEFORE the update
		const affectedKiosksBeforeUpdate = await KioskModel.find({ readerId }).lean()

		// Set readerId to null in associated Kiosks
		logger.debug(`Setting readerId ${readerId} to null in associated Kiosks`)
		const updateResult = await KioskModel.updateMany({ readerId }, { $set: { readerId: null } })
		logger.debug(`Set readerId to null in ${updateResult.modifiedCount} Kiosks`)

		// Emit updates for affected kiosks
		for (const kioskDoc of affectedKiosksBeforeUpdate) {
			const updatedKiosk = await KioskModel.findById(kioskDoc._id)
			if (updatedKiosk) {
				emitKioskUpdated(transformKiosk(updatedKiosk))
			}
		}

		logger.info(`Reader deleted successfully: ID ${readerId}, API Ref "${docToDelete.apiReferenceId}", Tag "${docToDelete.readerTag}"`)
		emitReaderDeleted(readerId.toString())

		next()
	} catch (error) {
		logger.error('Error in pre-deleteOne hook for Reader filter:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteOne hook failed'))
	}
})

// Pre-delete-many middleware (query-based)
readerSchema.pre('deleteMany', async function (next) {
	// 'this' refers to the query object
	const filter = this.getFilter()
	logger.warn('Executing deleteMany on Readers with filter:', filter)

	try {
		const docsToDelete = await ReaderModel.find(filter).select('_id').lean()
		const docIds = docsToDelete.map(doc => doc._id)

		if (docIds.length > 0) {
			logger.info(`Preparing to delete ${docIds.length} readers via deleteMany: IDs [${docIds.join(', ')}]`)

			// Find kiosks that will be affected BEFORE the update
			const affectedKiosksBeforeUpdate = await KioskModel.find({ readerId: { $in: docIds } }).lean()

			// Set readerId to null in associated Kiosks
			logger.debug(`Setting reader IDs [${docIds.join(', ')}] to null in associated Kiosks`)
			const updateResult = await KioskModel.updateMany({ readerId: { $in: docIds } }, { $set: { readerId: null } })
			logger.debug(`Set reader IDs to null in ${updateResult.modifiedCount} Kiosks`)

			// Emit updates for affected kiosks
			for (const kioskDoc of affectedKiosksBeforeUpdate) {
				const updatedKiosk = await KioskModel.findById(kioskDoc._id)
				if (updatedKiosk) {
					emitKioskUpdated(transformKiosk(updatedKiosk))
				}
			}
		} else {
			logger.info('deleteMany on Readers: No documents matched the filter.')
		}
		next()
	} catch (error) {
		logger.error('Error in pre-deleteMany hook for Readers with filter:', { filter, error })
		next(error instanceof Error ? error : new Error('Pre-deleteMany hook failed'))
	}
})

// Post-delete middleware
readerSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc, next) {
	logger.info(`Reader deleted successfully: ID ${doc._id}, API Ref "${doc.apiReferenceId}", Tag "${doc.readerTag}"`)
	try {
		emitReaderDeleted(doc.id) // Emit with ID
	} catch (error) {
		logger.error(`Error emitting WebSocket event for deleted Reader ID ${doc.id} in post-delete hook:`, { error })
	}
	next()
})

readerSchema.post('deleteMany', function (result, next) {
	logger.info(`deleteMany on Readers completed. Deleted count: ${result.deletedCount}`)
	next()
})

// Reader methods
readerSchema.methods.generateNewReaderTag = async function (this: IReader): Promise<string> {
	const oldTag = this.readerTag
	logger.info(`Generating new readerTag for reader: ID ${this.id}, Old Tag: ${oldTag}`)
	try {
		this.readerTag = await generateUniqueReaderTag()
		await this.save() // Save the reader with the new tag
		logger.info(`New readerTag "${this.readerTag}" generated and saved for reader ID ${this.id}`)
		return this.readerTag
	} catch (error) {
		logger.error(`Failed to generate and save new readerTag for reader ID ${this.id}`, { error })
		throw error // Re-throw error
	}
}

// Helper function for generating unique tag
async function generateUniqueReaderTag (): Promise<string> {
	let attempts = 0
	const maxAttempts = 10 // Prevent infinite loop
	let newReaderTag: string
	let foundReaderWithTag: FlattenMaps<IReader> | null

	logger.silly('Attempting to generate a unique readerTag...')
	do {
		if (attempts >= maxAttempts) {
			logger.error(`Failed to generate a unique readerTag after ${maxAttempts} attempts.`)
			throw new Error('Could not generate unique reader tag')
		}
		newReaderTag = nanoid()
		logger.silly(`Generated candidate readerTag: ${newReaderTag} (Attempt ${attempts + 1})`)
		foundReaderWithTag = await ReaderModel.findOne({ readerTag: newReaderTag }).lean()
		attempts++
	} while (foundReaderWithTag !== null)

	logger.debug(`Unique readerTag generated: ${newReaderTag} after ${attempts} attempts.`)
	return newReaderTag
}

// Compile the schema into a model
const ReaderModel = model<IReader>('Reader', readerSchema)

// Export the model
export default ReaderModel
