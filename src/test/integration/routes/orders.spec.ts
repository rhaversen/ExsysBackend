// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { type Types } from 'mongoose'
import { chaiAppServer as agent } from '../../testSetup.js'
import sinon from 'sinon'

// Own modules
import OrderModel from '../../../app/models/Order.js'
import ProductModel, { type IProduct } from '../../../app/models/Product.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'
import OptionModel, { type IOption } from '../../../app/models/Option.js'

describe('POST /v1/orders', function () {
	let testProduct1: IProduct
	let testRoom: IRoom
	let testOption: IOption
	let testOrderFields: {
		roomId: Types.ObjectId
		products: Array<{
			id: Types.ObjectId
			quantity: number
		}>
		options?: Array<{
			id: Types.ObjectId
			quantity: number
		}>
	}

	beforeEach(async function () {
		testProduct1 = await ProductModel.create({
			name: 'Test Product',
			price: 100,
			description: 'A test product',
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			}
		})

		testRoom = await RoomModel.create({
			name: 'Test Room',
			description: 'A test room'
		})

		testOption = await OptionModel.create({
			name: 'Test Option',
			price: 50,
			description: 'A test option'
		})

		testOrderFields = {
			roomId: testRoom.id,
			products: [{
				id: testProduct1.id,
				quantity: 1
			}],
			options: [{
				id: testOption1.id,
				quantity: 1
			}]
		}
	})

	it('should create a valid order', async function () {
		await agent.post('/v1/orders').send(testOrderFields)
		const order = await OrderModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.exist
		expect(order?.roomId.toString()).to.equal(testRoom.id)
		expect(order?.products[0].id.toString()).to.equal(testOrderFields.products[0].id)
		expect(order?.products[0].quantity).to.equal(testOrderFields.products[0].quantity)
		expect(order?.options?.[0].id.toString()).to.equal(testOrderFields.options?.[0].id)
		expect(order?.options?.[0].quantity).to.equal(testOrderFields.options?.[0].quantity)
	})

	it('should return the order', async function () {
		const res = await agent.post('/v1/orders').send(testOrderFields)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body.roomId.toString()).to.equal(testRoom.id)
		expect(res.body.products[0].id).to.equal(testOrderFields.products[0].id)
		expect(res.body.products[0].quantity).to.equal(testOrderFields.products[0].quantity)
		expect(res.body.options?.[0].id).to.equal(testOrderFields.options?.[0].id)
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
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 23,
							minute: 59
						}
					}
				})
			})

			it('should create a order with a product with quantity 0', async function () {
				testOrderFields.products.push({
					id: testProduct2.id,
					quantity: 0
				})
				await agent.post('/v1/orders').send(testOrderFields)
				const order = await OrderModel.findOne({})
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(order).to.exist
			})

			it('should remove products with quantity 0', async function () {
				testOrderFields.products.push({
					id: testProduct2.id,
					quantity: 0
				})
				await agent.post('/v1/orders').send(testOrderFields)
				const order = await OrderModel.findOne({})
				expect(order?.products.length).to.equal(1)
			})

			it('should combine products with the same product id', async function () {
				testOrderFields.products.push({
					id: testProduct1.id,
					quantity: 1
				})
				await agent.post('/v1/orders').send(testOrderFields)
				const order = await OrderModel.findOne({})
				expect(order?.products[0].quantity).to.equal(2)
			})
		})

		describe('Option', function () {
			let testOption2: IOption

			beforeEach(async function () {
				testOption2 = await OptionModel.create({
					name: 'Test Option1',
					price: 50,
					description: 'A test option'
				})
			})

			it('should create a order with a option with quantity 0', async function () {
				testOrderFields.options?.push({
					id: testOption2.id,
					quantity: 0
				})
				await agent.post('/v1/orders').send(testOrderFields)
				const order = await OrderModel.findOne({})
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(order).to.exist
			})

			it('should remove options with quantity 0', async function () {
				testOrderFields.options?.push({
					id: testOption2.id,
					quantity: 0
				})
				await agent.post('/v1/orders').send(testOrderFields)
				const order = await OrderModel.findOne({})
				expect(order?.options?.length).to.equal(1)
			})

			it('should combine options with the same option id', async function () {
				testOrderFields.options?.push({
					id: testOption.id,
					quantity: 1
				})
				await agent.post('/v1/orders').send(testOrderFields)
				const order = await OrderModel.findOne({})
				expect(order?.options?.[0].quantity).to.equal(2)
			})
		})
	})
})

describe('GET /v1/orders', function () {
	let testProduct1: IProduct
	let testProduct2: IProduct
	let testRoom: IRoom
	let testOption: IOption
	let clock: sinon.SinonFakeTimers

	beforeEach(async function () {
		clock = sinon.useFakeTimers(new Date('2024-04-24T11:00:00Z').getTime())

		testProduct1 = await ProductModel.create({
			name: 'Test Product1',
			price: 100,
			description: 'A test product',
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			}
		})

		testProduct2 = await ProductModel.create({
			name: 'Test Product2',
			price: 100,
			description: 'A test product',
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			}
		})

		testRoom = await RoomModel.create({
			name: 'Test Room',
			description: 'A test room'
		})

		testOption = await OptionModel.create({
			name: 'Test Option',
			price: 50,
			description: 'A test option'
		})

		await OrderModel.create({
			roomId: testRoom.id,
			products: [{
				id: testProduct1.id,
				quantity: 1
			}],
			options: [{
				id: testOption.id,
				quantity: 1
			}]
		})

		await OrderModel.create({
			roomId: testRoom.id,
			products: [{
				id: testProduct2.id,
				quantity: 1
			}],
			options: [{
				id: testOption.id,
				quantity: 1
			}]
		})
	})

	it('should return all orders', async function () {
		const res = await agent.get('/v1/orders')
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body[0].roomId).to.equal(testRoom.id)
		expect(res.body[0].products[0].id).to.equal(testProduct1.id)
		expect(res.body[0].products[0].quantity).to.equal(1)
		expect(res.body[0].options[0].id).to.equal(testOption.id)
		expect(res.body[0].options[0].quantity).to.equal(1)
		expect(res.body[1].roomId).to.equal(testRoom.id)
		expect(res.body[1].products[0].id).to.equal(testProduct2.id)
		expect(res.body[1].products[0].quantity).to.equal(1)
		expect(res.body[1].options[0].id).to.equal(testOption.id)
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
					description: 'A test option'
				})

				testOption4 = await OptionModel.create({
					name: 'Test Option4',
					price: 50,
					description: 'A test option'
				})

				await OrderModel.create({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption3.id,
						quantity: 1
					}]
				})

				await OrderModel.create({
					roomId: testRoom.id,
					products: [{
						id: testProduct2.id,
						quantity: 1
					}],
					options: [{
						id: testOption4.id,
						quantity: 1
					}]
				})
			})

			it('should return all orders for today', async function () {
				const res = await agent.get('/v1/orders/today')
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(res.body).to.exist
				expect(res.body.length).to.equal(2)
				expect(res.body[0].options[0].id).to.equal(testOption3.id)
				expect(res.body[1].options[0].id).to.equal(testOption4.id)
			})
		})
	})
})
