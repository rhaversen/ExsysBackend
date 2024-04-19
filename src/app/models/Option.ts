// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'

// Destructuring and global variables

// Interfaces
export interface IOption extends Document {
    _id: Types.ObjectId
    optionName: String // The name of the option
    maxQuantity: number // The maximum quantity of the option that can be ordered
    description: string // A description of the option
    availability: number // The number of the option that is available
    price: number // The price of the option
}

// Schema
const orderSchema = new Schema<IOption>({
    optionName: {
        type: Schema.Types.String,
        required: [true, 'Optionname er påkrævet'],
        maxlength: [20, 'Optionname kan højest have 20 tegn'],
    },
    description: {
        type: Schema.Types.String,
        required: [true, 'Description er påkrævet'],
        maxlength: [50, 'Description kan højest have 50 tegn'],
    },
    availability: {
        type: Schema.Types.Number,
        required: [true, 'Availability er påkrævet'],
        min: [0, 'Availability skal være større eller lig med 0'],
    },
    price: {
        type: Schema.Types.Number,
        required: [true, 'Price er påkrævet'],
        min: [0, 'Price skal være større eller lig med 0'],
    },
    maxQuantity: {
        type: Schema.Types.Number,
        required: [true, 'Max quantity er påkrævet'],
        min: [1, 'Max quantity skal være større end 0'],
    },
})

// Adding indexes

// Pre-save middleware
orderSchema.pre('save', function (next) {
    logger.silly('Saving order')
    next()
})

// Compile the schema into a model
const OptionModel = model<IOption>('Option', orderSchema)

// Export the model
export default OptionModel
