// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { Types } from 'mongoose'
import sinon from 'sinon'

// Own modules
import OrderModel from '../../app/models/Order.js'
import ProductModel, { type IProduct } from '../../app/models/Product.js'
import RoomModel, { type IRoom } from '../../app/models/Room.js'
import OptionModel, { type IOption } from '../../app/models/Option.js'

// Setup test environment
import '../testSetup.js'

describe('Order Model', function () {
    let testProduct: IProduct
    let testRoom: IRoom
    let testOption: IOption
    let testOrderFields: {
        requestedDeliveryDate: Date
        roomId: Types.ObjectId
        products: Array<{
            productId: Types.ObjectId
            quantity: number
        }>
        options: Array<{
            optionId: Types.ObjectId
            quantity: number
        }>
    }

    beforeEach(async function () {
        testProduct = await ProductModel.create({
            name: 'Test Product',
            price: 100,
            description: 'A test product',
            availability: 100,
            orderWindow: {
                from: { hour: 0, minute: 0 },
                to: { hour: 23, minute: 59 }
            },
            maxOrderQuantity: 10
        })

        testRoom = await RoomModel.create({
            name: 'Test Room',
            description: 'A test room'
        })

        testOption = await OptionModel.create({
            optionName: 'Test Option',
            price: 50,
            description: 'A test option',
            availability: 100,
            maxOrderQuantity: 10
        })

        testOrderFields = {
            requestedDeliveryDate: new Date().setDate(new Date().getDate() + 10000),
            roomId: testRoom._id,
            products: [{
                productId: testProduct._id,
                quantity: 1
            }],
            options: [{
                optionId: testOption._id,
                quantity: 1
            }]
        }
    })

    it('should not allow a requested delivery date in the past', async function () {
        let errorOccurred = false
        try {
            await OrderModel.create({
                ...testOrderFields,
                requestedDeliveryDate: new Date().setDate(new Date().getDate() - 1000)
            })
        } catch (err) {
            // The promise was rejected as expected
            errorOccurred = true
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(errorOccurred).to.be.true
    })
})
