// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'

// Own modules

// Environment variables

// Config variables

// Destructuring and global variables

// Interfaces
export interface IConfigs extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	kioskInactivityTimeoutMs: number
	kioskInactivityTimeoutWarningMs: number
	kioskOrderConfirmationTimeoutMs: number
	disabledWeekdays: number[] // 0=Monday, 6=Sunday
	kioskPassword: string

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
	},
	createdAt: Date
	updatedAt: Date
}

// Schema
const configsSchema = new Schema<IConfigs>({
	kioskInactivityTimeoutMs: {
		type: Schema.Types.Number,
		default: 60000, // 60 seconds
		min: [1000, 'Inaktivitets timeout skal være mindst 1 sekund'],
	},
	kioskInactivityTimeoutWarningMs: {
		type: Schema.Types.Number,
		default: 10000, // 10 seconds
		min: [1000, 'Inaktivitets timeout advarsel skal være mindst 1 sekund'],
	},
	kioskOrderConfirmationTimeoutMs: {
		type: Schema.Types.Number,
		default: 10000, // 10 seconds
		min: [1000, 'Ordrebekræftelses timeout skal være mindst 1 sekund'],
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
		minlength: [4, 'Adgangskode skal være mindst 4 tegn'],
		maxLength: [100, 'Adgangskode kan højest være 100 tegn']
	}
}, {
	timestamps: true
})

// Validations

// Adding indexes

// Pre-save middleware

// Compile the schema into a model
const ConfigsModel = model<IConfigs>('Configs', configsSchema)

// Export the model
export default ConfigsModel
