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
        required: [true, 'Leveringstidspunkt er påkrevet'],
        validate: {
            validator: function (v: Date) {
                // Ensure the requested delivery date is not in the past
                return v >= new Date()
            },
            message: 'Leveringstidspunkt skal være i fremtiden'
        }
    },
    roomId: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required: [true, 'Rum er påkrevet'],
        validate: {
            validator: async function (v: Types.ObjectId) {
                const room = await RoomModel.findById(v)
                return room !== null && room !== undefined
            },
            message: 'Rummet eksisterer ikke'
        }
    },
    products: [{
        type: Schema.Types.Mixed,
        required: [true, 'Produkter er påkrevet'],
        product: {
            type: Schema.Types.ObjectId,
            unique: true,
            ref: 'Product',
            required: [true, 'Produkt er påkrevet'],
            validate: [{
                validator: async function (v: Types.ObjectId) {
                    const product = await ProductModel.findById(v)
                    return product !== null && product !== undefined
                },
                message: 'Produktet eksisterer ikke'
            }, {
                validator: async function (v: Types.ObjectId) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const product = (await ProductModel.findById(v))! // Existence of product is already checked
                    const nowHour = new Date().getHours()
                    const nowMinute = new Date().getMinutes()

                    const from = product.orderWindow.from
                    const to = product.orderWindow.to

                    const isWithinHour = from.hour < nowHour && nowHour < to.hour
                    const isStartHour = nowHour === from.hour && nowMinute >= from.minute
                    const isEndHour = nowHour === to.hour && nowMinute <= to.minute

                    return isWithinHour || isStartHour || isEndHour
                },
                message: 'Bestillingen er uden for bestillingsvinduet'
            }]
        },
        quantity: {
            type: Schema.Types.Number,
            required: [true, 'Mængde er påkrevet'],
            min: [1, 'Mængde skal være større end 0'],
            max: [100, 'Mængde skal være mindre end eller lig med 100'],
            default: 1
        }
    }],
    options: [{
        type: Schema.Types.Mixed,
        required: false,
        option: {
            type: Schema.Types.ObjectId,
            unique: true,
            ref: 'Option',
            required: [true, 'Tilvalg er påkrevet'],
            validate: {
                validator: async function (v: Types.ObjectId) {
                    const option = await OptionModel.findById(v)
                    return option !== null && option !== undefined
                },
                message: 'Tilvalget eksisterer ikke'
            }
        },
        quantity: {
            type: Schema.Types.Number,
            required: [true, 'Mængde er påkrevet'],
            min: [1, 'Mængde skal være større end 0'],
            max: [100, 'Mængde skal være mindre end eller lig med 100'],
            default: 1
        }
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
