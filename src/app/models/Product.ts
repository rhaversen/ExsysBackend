// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'

// Destructuring and global variables

// Interfaces
export interface IProduct extends Document {
    _id: Types.ObjectId
}

// Schema
const productSchema = new Schema<IProduct>({
})

// Adding indexes

// Pre-save middleware
productSchema.pre('save', function (next) {
    logger.silly('Saving order')
    next()
})

// Compile the schema into a model
const ProductModel = model<IProduct>('Product', productSchema)

// Export the model
export default ProductModel
