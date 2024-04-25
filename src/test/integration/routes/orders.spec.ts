// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { type Types } from 'mongoose'
import { chaiAppServer as agent } from '../../testSetup.js'
import sinon from 'sinon'

// Own modules
import OrderModel, { type IOrder } from '../../../app/models/Order.js'
import ProductModel, { type IProduct } from '../../../app/models/Product.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'
import OptionModel, { type IOption } from '../../../app/models/Option.js'

describe('POST /v1/orders', function () {
	let testProduct1: IProduct
	let testRoom: IRoom
	let testOption: IOption
	let testOrderFields: {
		requestedDeliveryDate: Date
		roomId: Types.ObjectId
		products: Array<{
			productId: Types.ObjectId
			quantity: number
		}>
		options?: Array<{
			optionId: Types.ObjectId
			quantity: number
		}>
	}

	beforeEach(async function () {
		testProduct1 = await ProductModel.create({
			name: 'Test Product',
			price: 100,
			description: 'A test product',
			availability: 100,
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			},
			maxOrderQuantity: 10
		})

		testRoom = await RoomModel.create({
			name: 'Test Room',
			description: 'A test room'
		})

		testOption = await OptionModel.create({
			name: 'Test Option',
			price: 50,
			description: 'A test option',
			availability: 100,
			maxOrderQuantity: 10
		})

		testOrderFields = {
			requestedDeliveryDate: new Date(),
			roomId: testRoom.id,
			products: [{
				productId: testProduct1.id,
				quantity: 1
			}],
			options: [{
				optionId: testOption.id,
				quantity: 1
			}]
		}
	})

	it('should create a valid order', async function () {
		await agent.post('/v1/orders').send(testOrderFields)
		const order = await OrderModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.exist
		expect(order?.requestedDeliveryDate.getTime()).to.equal(new Date(testOrderFields.requestedDeliveryDate).getTime())
		expect(order?.roomId.toString()).to.equal(testRoom.id)
		expect(order?.products[0].productId.toString()).to.equal(testOrderFields.products[0].productId)
		expect(order?.products[0].quantity).to.equal(testOrderFields.products[0].quantity)
		expect(order?.options?.[0].optionId.toString()).to.equal(testOrderFields.options?.[0].optionId)
		expect(order?.options?.[0].quantity).to.equal(testOrderFields.options?.[0].quantity)
	})

	it('should return the order', async function () {
		const res = await agent.post('/v1/orders').send(testOrderFields)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(new Date(res.body.requestedDeliveryDate as string).getTime()).to.equal(new Date(testOrderFields.requestedDeliveryDate).getTime())
		expect(res.body.roomId.toString()).to.equal(testRoom.id)
		expect(res.body.products[0].productId).to.equal(testOrderFields.products[0].productId)
		expect(res.body.products[0].quantity).to.equal(testOrderFields.products[0].quantity)
		expect(res.body.options?.[0].optionId).to.equal(testOrderFields.options?.[0].optionId)
		expect(res.body.options?.[0].quantity).to.equal(testOrderFields.options?.[0].quantity)
	})

	describe('Quantity validation', function () {
		describe('Product', function () {
			let testProduct2: IProduct

			beforeEach(async function () {
				testProduct2 = await ProductModel.create({
					name: 'Test Product1',
					price: 100,
					description: 'A test product',
					availability: 100,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 23,
							minute: 59
						}
					},
					maxOrderQuantity: 10
				})
			})

			it('should create a order with a product with quantity 0', async function () {
				testOrderFields.products.push({
					productId: testProduct2.id,
					quantity: 0
				})
				await agent.post('/v1/orders').send(testOrderFields)
				const order = await OrderModel.findOne({})
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(order).to.exist
			})

			it('should remove products with quantity 0', async function () {
				testOrderFields.products.push({
					productId: testProduct2.id,
					quantity: 0
				})
				await agent.post('/v1/orders').send(testOrderFields)
				const order = await OrderModel.findOne({})
				expect(order?.products.length).to.equal(1)
			})
		})

		describe('Option', function () {
			let testOption2: IOption

			beforeEach(async function () {
				testOption2 = await OptionModel.create({
					name: 'Test Option1',
					price: 50,
					description: 'A test option',
					availability: 100,
					maxOrderQuantity: 10
				})
			})

			it('should create a order with a option with quantity 0', async function () {
				testOrderFields.options?.push({
					optionId: testOption2.id,
					quantity: 0
				})
				await agent.post('/v1/orders').send(testOrderFields)
				const order = await OrderModel.findOne({})
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(order).to.exist
			})

			it('should remove options with quantity 0', async function () {
				testOrderFields.options?.push({
					optionId: testOption2.id,
					quantity: 0
				})
				await agent.post('/v1/orders').send(testOrderFields)
				const order = await OrderModel.findOne({})
				expect(order?.options?.length).to.equal(1)
			})
		})
	})
})

describe('GET /v1/orders', function () {
	let testProduct1: IProduct
	let testProduct2: IProduct
	let testRoom: IRoom
	let testOption: IOption
	let testOrder1: IOrder
	let testOrder2: IOrder
	let clock: sinon.SinonFakeTimers

	beforeEach(async function () {
		clock = sinon.useFakeTimers(new Date('2024-04-24T11:00:00Z').getTime())

		testProduct1 = await ProductModel.create({
			name: 'Test Product1',
			price: 100,
			description: 'A test product',
			availability: 100,
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			},
			maxOrderQuantity: 10
		})

		testProduct2 = await ProductModel.create({
			name: 'Test Product2',
			price: 100,
			description: 'A test product',
			availability: 100,
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			},
			maxOrderQuantity: 10
		})

		testRoom = await RoomModel.create({
			name: 'Test Room',
			description: 'A test room'
		})

		testOption = await OptionModel.create({
			name: 'Test Option',
			price: 50,
			description: 'A test option',
			availability: 100,
			maxOrderQuantity: 10
		})

		testOrder1 = await OrderModel.create({
			requestedDeliveryDate: new Date(clock.now + 5 * 60 * 60 * 1000), // 5 hours later
			roomId: testRoom.id,
			products: [{
				productId: testProduct1.id,
				quantity: 1
			}],
			options: [{
				optionId: testOption.id,
				quantity: 1
			}]
		})

		testOrder2 = await OrderModel.create({
			requestedDeliveryDate: new Date(clock.now + 5 * 60 * 60 * 1000), // 5 hours later
			roomId: testRoom.id,
			products: [{
				productId: testProduct2.id,
				quantity: 1
			}],
			options: [{
				optionId: testOption.id,
				quantity: 1
			}]
		})
	})

	it('should return all orders', async function () {
		const res = await agent.get('/v1/orders')
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body[0].requestedDeliveryDate).to.equal(testOrder1.requestedDeliveryDate.toISOString())
		expect(res.body[0].roomId).to.equal(testRoom.id)
		expect(res.body[0].products[0].productId).to.equal(testProduct1.id)
		expect(res.body[0].products[0].quantity).to.equal(1)
		expect(res.body[0].options[0].optionId).to.equal(testOption.id)
		expect(res.body[0].options[0].quantity).to.equal(1)
		expect(res.body[1].requestedDeliveryDate).to.equal(testOrder2.requestedDeliveryDate.toISOString())
		expect(res.body[1].roomId).to.equal(testRoom.id)
		expect(res.body[1].products[0].productId).to.equal(testProduct2.id)
		expect(res.body[1].products[0].quantity).to.equal(1)
		expect(res.body[1].options[0].optionId).to.equal(testOption.id)
		expect(res.body[1].options[0].quantity).to.equal(1)
		expect(res.body.length).to.equal(2)
	})

	it('should return an empty array if there are no orders', async function () {
		await OrderModel.deleteMany({})
		const res = await agent.get('/v1/orders')
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body.length).to.equal(0)
	})

	describe('GET /v1/orders/today', function () {
		let testOption3: IOption
		let testOption4: IOption

		beforeEach(function () {
			clock.tick(24 * 60 * 60 * 1000) // Advance time by 24 hours
		})

		describe('No orders for today', function () {
			it('should return an empty array if there are no orders for today', async function () {
				const res = await agent.get('/v1/orders/today')
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(res.body).to.exist
				expect(res.body.length).to.equal(0)
			})
		})

		describe('Some orders for today', function () {
			beforeEach(async function () {
				testOption3 = await OptionModel.create({
					name: 'Test Option3',
					price: 50,
					description: 'A test option',
					availability: 100,
					maxOrderQuantity: 10
				})

				testOption4 = await OptionModel.create({
					name: 'Test Option4',
					price: 50,
					description: 'A test option',
					availability: 100,
					maxOrderQuantity: 10
				})

				await OrderModel.create({
					requestedDeliveryDate: new Date(clock.now + 5 * 60 * 60 * 1000), // 5 hours later
					roomId: testRoom.id,
					products: [{
						productId: testProduct1.id,
						quantity: 1
					}],
					options: [{
						optionId: testOption3.id,
						quantity: 1
					}]
				})

				await OrderModel.create({
					requestedDeliveryDate: new Date(clock.now + 5 * 60 * 60 * 1000), // 5 hours later
					roomId: testRoom.id,
					products: [{
						productId: testProduct2.id,
						quantity: 1
					}],
					options: [{
						optionId: testOption4.id,
						quantity: 1
					}]
				})
			})

			it('should return all orders for today', async function () {
				const res = await agent.get('/v1/orders/today')
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(res.body).to.exist
				expect(res.body.length).to.equal(2)
				expect(res.body[0].options[0].optionId).to.equal(testOption3.id)
				expect(res.body[1].options[0].optionId).to.equal(testOption4.id)
			})
		})
	})
})
