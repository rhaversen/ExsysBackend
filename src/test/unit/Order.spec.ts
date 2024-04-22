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
		// Set the fake time to a specific date and time that is before lunch
		const fakeTime = new Date('2024-04-21T10:00:00Z').getTime()
		sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

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
			roomName: 'Test Room',
			description: 'A test room',
			roomNumber: 1,
			roomDescription: 'A test room'
		})

		testOption = await OptionModel.create({
			optionName: 'Test Option',
			price: 50,
			description: 'A test option',
			availability: 100,
			maxOrderQuantity: 10
		})

		testOrderFields = {
			requestedDeliveryDate: new Date('2024-04-21T15:00:00Z'),
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

	it('should create a valid order', async function () {
		const order = await OrderModel.create(testOrderFields)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.exist
		expect(order.requestedDeliveryDate.getTime()).to.equal(new Date(testOrderFields.requestedDeliveryDate).getTime())
		expect(order.roomId).to.equal(testRoom._id)
		expect(order.products[0].productId).to.equal(testOrderFields.products[0].productId)
		expect(order.products[0].quantity).to.equal(testOrderFields.products[0].quantity)
		expect(order.options?.[0].optionId).to.equal(testOrderFields.options[0].optionId)
		expect(order.options?.[0].quantity).to.equal(testOrderFields.options[0].quantity)
	})

	it('should not allow non-integer quantities for products', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [{
					productId: testProduct._id,
					quantity: 1.5
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow non-integer quantities for options', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [{
					optionId: testOption._id,
					quantity: 1.5
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow no requested delivery date', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				requestedDeliveryDate: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should allow no options', async function () {
		const order = await OrderModel.create({
			...testOrderFields,
			options: undefined
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.exist
	})

	it('should require a requested delivery date', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				requestedDeliveryDate: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
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

	it('should require a room', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				roomId: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow a room that does not exist', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				roomId: new Types.ObjectId()
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should require products', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow products that do not exist', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [{
					productId: new Types.ObjectId(),
					quantity: 1
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should require that products are unique', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [
					{
						productId: testProduct._id,
						quantity: 1
					},
					{
						productId: testProduct._id,
						quantity: 1
					}
				]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should require a quantity for products', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [{
					productId: testProduct._id,
					quantity: undefined
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow products with a quantity of 0', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [{
					productId: testProduct._id,
					quantity: 0
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow products with a quantity less than 0', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [{
					productId: testProduct._id,
					quantity: -1
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow a product quantity greater than available', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [{
					productId: testProduct._id,
					quantity: testProduct.availability + 1
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow a product quantity greater than maxOrderQuantity', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [
					{ productId: testProduct._id, quantity: testProduct.maxOrderQuantity + 1 }
				]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not require options', async function () {
		const order = await OrderModel.create({
			...testOrderFields,
			options: undefined
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.exist
	})

	it('should not allow options that do not exist', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [{
					optionId: new Types.ObjectId(),
					quantity: 1
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should require that options are unique', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [
					{
						optionId: testOption._id,
						quantity: 1
					},
					{
						optionId: testOption._id,
						quantity: 1
					}
				]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should require a quantity for options', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [{
					optionId: testOption._id,
					quantity: undefined
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow options with a quantity of 0', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [{
					optionId: testOption._id,
					quantity: 0
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow options with a quantity less than 0', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [{
					optionId: testOption._id,
					quantity: -1
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow a option quantity greater than available', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [{
					optionId: testOption._id,
					quantity: testOption.availability + 1
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow a option quantity greater than maxOrderQuantity', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [
					{ optionId: testOption._id, quantity: testOption.maxOrderQuantity + 1 }
				]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow duplicate options in an order', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [
					{ optionId: testOption._id, quantity: 1 },
					{ optionId: testOption._id, quantity: 1 }
				]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow a requested delivery date after the current day', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				requestedDeliveryDate: new Date('2024-04-22T10:00:00Z') // 24 hours after the fake time
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	describe('Order Window Validation', function () {
		let testProductBeforeLunch: IProduct
		let testProductAfterLunch: IProduct

		beforeEach(async function () {
			sinon.restore() // Restore the JavaScript environment's time

			testProductBeforeLunch = await ProductModel.create({
				name: 'Before Lunch',
				price: 100,
				description: 'A test product',
				availability: 100,
				orderWindow: {
					from: { hour: 0, minute: 0 },
					to: { hour: 12, minute: 0 }
				},
				maxOrderQuantity: 10
			})

			testProductAfterLunch = await ProductModel.create({
				name: 'After Lunch',
				price: 100,
				description: 'A test product',
				availability: 100,
				orderWindow: {
					from: { hour: 12, minute: 0 },
					to: { hour: 23, minute: 59 }
				},
				maxOrderQuantity: 10
			})
		})

		it('should not allow products to be ordered before the order window', async function () {
			// Set the fake time to a specific date and time that is before lunch
			const fakeTime = new Date('2024-04-21T10:00:00Z').getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			let errorOccurred = false
			try {
				await OrderModel.create({
					...testOrderFields,
					products: [{
						productId: testProductAfterLunch._id,
						quantity: 1
					}]
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should not allow products to be ordered after the order window', async function () {
			// Set the fake time to a specific date and time that is before lunch
			const fakeTime = new Date('2024-04-21T14:00:00Z').getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			let errorOccurred = false
			try {
				await OrderModel.create({
					...testOrderFields,
					products: [{
						productId: testProductBeforeLunch._id,
						quantity: 1
					}]
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should allow products to be ordered deep within the order window before lunch', async function () {
			// Set the fake time to a specific date and time that is before lunch
			const fakeTime = new Date('2024-04-21T10:00:00Z').getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			const order = await OrderModel.create({
				...testOrderFields,
				products: [{
					productId: testProductBeforeLunch._id,
					quantity: 1
				}]
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(order).to.exist
		})

		it('should allow products to be ordered deep within the order window after lunch', async function () {
			// Set the fake time to a specific date and time that is after lunch
			const fakeTime = new Date('2024-04-21T14:00:00Z').getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			const order = await OrderModel.create({
				...testOrderFields,
				products: [{
					productId: testProductAfterLunch._id,
					quantity: 1
				}]
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(order).to.exist
		})

		it('should allow products to be ordered within the last hour of the order window', async function () {
			// Set the fake time to a specific date and time that is within the last hour of the order window
			const fakeTime = new Date('2024-04-21T11:59:00Z').getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			const order = await OrderModel.create({
				...testOrderFields,
				products: [{
					productId: testProductBeforeLunch._id,
					quantity: 1
				}]
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(order).to.exist
		})

		it('should allow products to be ordered within the first hour of the order window', async function () {
			// Set the fake time to a specific date and time that is within the first hour of the order window
			const fakeTime = new Date('2024-04-21T12:01:00Z').getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			const order = await OrderModel.create({
				...testOrderFields,
				products: [{
					productId: testProductAfterLunch._id,
					quantity: 1
				}]
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(order).to.exist
		})
	})
})
