// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'

// Destructuring and global variables

// Interfaces
export interface IOption extends Document {
	_id: Types.ObjectId
	name: string // The name of the option
	description: string // A description of the option
	price: number // The price of the option
}

// Schema
const optionSchema = new Schema<IOption>({
	name: {
		type: Schema.Types.String,
		trim: true,
		required: [true, 'Navnet er påkrævet'],
		maxLength: [20, 'Navnet kan højest have 20 tegn']
	},
	description: {
		type: Schema.Types.String,
		trim: true,
		required: [true, 'Beskrivelsen er påkrævet'],
		maxLength: [50, 'Beskrivelsen kan højest have 50 tegn']
	},
	price: {
		type: Schema.Types.Number,
		required: [true, 'Prisen er påkrævet'],
		min: [0, 'Prisen skal være større eller lig med 0']
	}
}, {
	timestamps: true
})

// Validations

// Adding indexes

// Pre-save middleware
optionSchema.pre('save', function (next) {
	logger.silly('Saving option')
	next()
})

// Compile the schema into a model
const OptionModel = model<IOption>('Option', optionSchema)

// Export the model
export default OptionModel
