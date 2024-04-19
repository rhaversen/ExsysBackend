// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'

// Destructuring and global variables

// Interfaces
export interface IProduct extends Document {
    _id: Types.ObjectId
    name: string
    price: number
    description: string
    availability : number
    orderWindow: {
        from: {
            hour: number
            minute: number
        }
        to: {
            hour: number
            minute: number
        }
    }
    options?: Array<{
        option: Types.ObjectId
        quantity: number
    }>

}

// Schema
const productSchema = new Schema<IProduct>({
    name: {
        type: Schema.Types.String,
        required: [true, 'Product name is required']
    },
    price: {
        type: Schema.Types.Number,
        required: [true, 'Product price is required']
    },
    description: {
        type: Schema.Types.String,
        required: [true, 'Product description is required']
    },
    availability: {
        type: Schema.Types.Number,
        required: [true, 'Product availability is required'],
        min: [0, 'Availability cannot be negative']
    },
    options: [{
        type: Schema.Types.ObjectId,
        ref: 'Option'
    }],
    orderWindow: {
        from: {
            hour: {
                type: Schema.Types.Number,
                required: [true, 'Start hour is required']
            },
            minute: {
                type: Schema.Types.Number,
                required: [true, 'Start minute is required']
            }
        },
        to: {
            hour: {
                type: Schema.Types.Number,
                required: [true, 'End hour is required']
            },
            minute: {
                type: Schema.Types.Number,
                required: [true, 'End minute is required']
            }
        }
    }
})

// Adding indexes

// Pre-save middleware
productSchema.pre('save', function (next) {
    logger.silly('Saving product')
    next()
})

// Compile the schema into a model
const ProductModel = model<IProduct>('Product', productSchema)

// Export the model
export default ProductModel
