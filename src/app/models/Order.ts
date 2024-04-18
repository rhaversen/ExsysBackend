// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import OptionModel from './Option.js'
import ProductModel from './Product.js'
import RoomModel from './Room.js'

// Destructuring and global variables

// Interfaces
export interface IOrder extends Document {
    _id: Types.ObjectId
    requestedDeliveryDate: Date // The date the order is supposed to be delivered
    roomId: Types.ObjectId // Reference to the Room document
    products: Array<{
        product: Types.ObjectId
        quantity: number
    }> // The products and their quantities
    options?: Array<{
        option: Types.ObjectId
        quantity: number
    }> // Additional options for the order
}

// Schema
const orderSchema = new Schema<IOrder>({
    requestedDeliveryDate: {
        type: Schema.Types.Date,
        required: [true, 'Requested delivery date is required'],
        validate: {
            validator: function (v: Date) {
                // Ensure the requested delivery date is not in the past
                return v >= new Date()
            },
            message: 'Requested delivery date cannot be in the past'
        }
    },
    roomId: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required: [true, 'Room name is required'],
        validate: {
            validator: async function (v: Types.ObjectId) {
                const room = await RoomModel.findById(v)
                return room !== null && room !== undefined
            },
            message: 'No such room exists'
        }
    },
    products: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required'],
            validate: {
                validator: async function (v: Types.ObjectId) {
                    const product = await ProductModel.findById(v)
                    return product !== null && product !== undefined
                },
                message: 'No such product exists'
            }
        },
        quantity: {
            type: Schema.Types.Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be greater than 0'],
            max: [100, 'Quantity must be less than or equal to 100'],
            default: 1
        },
        required: [true, 'Products are required']
    }],
    options: [{
        option: {
            type: Schema.Types.ObjectId,
            ref: 'Option',
            required: [true, 'Option is required'],
            validate: {
                validator: async function (v: Types.ObjectId) {
                    const option = await OptionModel.findById(v)
                    return option !== null && option !== undefined
                },
                message: 'No such option exists'
            }
        },
        quantity: {
            type: Schema.Types.Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be greater than 0'],
            max: [100, 'Quantity must be less than or equal to 100'],
            default: 1
        },
        required: false
    }]
}, {
    timestamps: true
})

// Adding indexes
orderSchema.index({ requestedDeliveryDate: -1 })

// Pre-save middleware
orderSchema.pre('save', function (next) {
    logger.silly('Saving order')
    next()
})

// Compile the schema into a model
const OrderModel = model<IOrder>('Order', orderSchema)

// Export the model
export default OrderModel
