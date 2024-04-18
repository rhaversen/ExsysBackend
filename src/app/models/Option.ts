// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'

// Destructuring and global variables

// Interfaces
export interface IOption extends Document {
    _id: Types.ObjectId
}

// Schema
const orderSchema = new Schema<IOption>({
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
