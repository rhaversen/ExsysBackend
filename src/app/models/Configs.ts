import { type Document, model, Schema, Types } from 'mongoose'

import { transformConfigs } from '../controllers/configsController.js'
import logger from '../utils/logger.js'
import { emitConfigsUpdated } from '../webSockets/configsHandlers.js'

export interface IConfigs extends Document {
	// Properties
	_id: Types.ObjectId
	kioskInactivityTimeoutMs: number
	kioskInactivityTimeoutWarningMs: number
	kioskOrderConfirmationTimeoutMs: number
	disabledWeekdays: number[] // 0=Monday, 6=Sunday
	kioskPassword: string
	kioskFeedbackBannerDelayMs: number
	kioskWelcomeMessage: string
	kioskReloadMsSinceMidnight: number

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

export interface IConfigsFrontend {
	_id: string
	configs: {
		kioskInactivityTimeoutMs: number
		kioskInactivityTimeoutWarningMs: number
		kioskOrderConfirmationTimeoutMs: number
		disabledWeekdays: number[] // 0=Monday, 6=Sunday
		kioskPassword: string
		kioskFeedbackBannerDelayMs: number
		kioskWelcomeMessage: string,
		kioskReloadMsSinceMidnight: number
	},
	createdAt: Date
	updatedAt: Date
}

// Schema
const configsSchema = new Schema<IConfigs>({
	kioskInactivityTimeoutMs: {
		type: Schema.Types.Number,
		default: 60000, // 60 seconds
		min: [1000, 'Inaktivitets timeout skal være mindst 1 sekund']
	},
	kioskInactivityTimeoutWarningMs: {
		type: Schema.Types.Number,
		default: 10000, // 10 seconds
		min: [1000, 'Inaktivitets timeout advarsel skal være mindst 1 sekund']
	},
	kioskOrderConfirmationTimeoutMs: {
		type: Schema.Types.Number,
		default: 10000, // 10 seconds
		min: [1000, 'Ordrebekræftelses timeout skal være mindst 1 sekund']
	},
	disabledWeekdays: {
		type: [Schema.Types.Number],
		default: [], // No days disabled by default
		validate: [{
			validator: (arr: number[]) => arr.every(n => n >= 0 && n <= 6),
			message: 'Deaktiverede ugedage skal være mellem 0 og 6 (0=Mandag, 6=Søndag)'
		},
		{
			validator: (arr: number[]) => arr.length <= 7,
			message: 'Der kan ikke være mere end 7 deaktiverede ugedage'
		},
		{
			validator: (arr: number[]) => new Set(arr).size === arr.length,
			message: 'Deaktiverede ugedage skal være unikke'
		}]
	},
	kioskPassword: {
		type: Schema.Types.String,
		trim: true,
		default: 'Password',
		minLength: [4, 'Adgangskode skal være mindst 4 tegn'],
		maxLength: [100, 'Adgangskode kan højest være 100 tegn']
	},
	kioskFeedbackBannerDelayMs: {
		type: Schema.Types.Number,
		default: 5000, // 5 seconds
		min: [0, 'Kiosk feedback banner forsinkelse skal være et positivt tal'],
		validate: {
			validator: Number.isInteger,
			message: 'Kiosk feedback banner forsinkelse skal være et heltal'
		}
	},
	kioskWelcomeMessage: {
		type: Schema.Types.String,
		trim: true,
		default: 'Bestilling af brød, kaffe og the',
		minLength: [1, 'Velkomstbesked skal være mindst 1 tegn'],
		maxLength: [200, 'Velkomstbesked kan højest være 200 tegn']
	},
	kioskReloadMsSinceMidnight: {
		type: Schema.Types.Number,
		default: 10800000, // 3 AM (3 * 60 * 60 * 1000)
		min: [3600000, 'Kiosk genindlæsningstidspunkt skal være mindst kl. 01:00'],
		max: [39600000, 'Kiosk genindlæsningstidspunkt skal være senest kl. 11:00'],
		validate: {
			validator: Number.isInteger,
			message: 'Kiosk genindlæsningstidspunkt skal være et heltal'
		}
	}
}, {
	timestamps: true
})

// Pre-save middleware
configsSchema.pre('save', async function (next) {
	logger.debug(`Saving configs: ${this._id}`)
	next()
})

// Post-save middleware
configsSchema.post('save', function (doc, next) {
	// Avoid logging password hash
	logger.debug(`Configs saved successfully: ID ${doc.id}`)
	try {
		const transformedConfigs = transformConfigs(doc)
		emitConfigsUpdated(transformedConfigs)
	} catch (error) {
		logger.error(`Error emitting WebSocket event for Configs ID ${doc.id} in post-save hook:`, { error })
	}
	next()
})

// Compile the schema into a model
const ConfigsModel = model<IConfigs>('Configs', configsSchema)

// Export the model
export default ConfigsModel
