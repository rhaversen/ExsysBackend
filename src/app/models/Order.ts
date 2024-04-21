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
        productId: Types.ObjectId
        quantity: number
    }> // The products and their quantities
    options?: Array<{
        optionId: Types.ObjectId
        quantity: number
    }> // Additional options for the order
}

// Sub-schema for products
const productsSubSchema = new Schema({
	productId: {
		type: Schema.Types.ObjectId,
		ref: 'Product',
		required: [true, 'Produkt er påkrevet']
	},
	quantity: {
		type: Schema.Types.Number,
		required: [true, 'Mængde er påkrevet'],
		min: [1, 'Mængde skal være større end 0']
	}
})

// Sub-schema for options
const optionsSubSchema = new Schema({
	optionId: {
		type: Schema.Types.ObjectId,
		ref: 'Option',
		required: [true, 'Tilvalg er påkrevet']
	},
	quantity: {
		type: Schema.Types.Number,
		required: [true, 'Mængde er påkrevet'],
		min: [1, 'Mængde skal være større end 0']
	}
})

// Main order schema
const orderSchema = new Schema({
	requestedDeliveryDate: {
		type: Schema.Types.Date,
		required: [true, 'Leveringstidspunkt er påkrevet']
	},
	roomId: {
		type: Schema.Types.ObjectId,
		ref: 'Room',
		required: [true, 'Rum er påkrevet']
	},
	products: {
		type: [productsSubSchema],
		required: [true, 'Produkter er påkrævet'],
		unique: true
	},
	options: {
		type: [optionsSubSchema],
		unique: true,
		default: undefined
	}
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
