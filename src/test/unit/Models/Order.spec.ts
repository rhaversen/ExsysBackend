/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { Types } from 'mongoose'
import sinon from 'sinon'

// Own modules
import OrderModel from '../../../app/models/Order.js'
import ProductModel, { type IProduct } from '../../../app/models/Product.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'
import OptionModel, { type IOption } from '../../../app/models/Option.js'
import ActivityModel, { type IActivity } from '../../../app/models/Activity.js'

// Setup test environment
import '../../testSetup.js'

describe('Order Model', function () {
	let testProduct: IProduct
	let testRoom: IRoom
	let testActivity: IActivity
	let testOption: IOption
	let testOrderFields: {
		activityId: Types.ObjectId
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
		// Set the fake time to a specific date and time that is before lunch
		const fakeTime = new Date('2024-04-21T10:00:00Z').getTime()
		sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

		testProduct = await ProductModel.create({
			name: 'Test Product',
			price: 100,
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
			description: 'A test room',
			number: 1
		})

		testActivity = await ActivityModel.create({
			roomId: testRoom.id,
			name: 'Test Activity'
		})

		testOption = await OptionModel.create({
			name: 'Test Option',
			price: 50
		})

		testOrderFields = {
			activityId: testActivity.id,
			products: [{
				id: testProduct.id,
				quantity: 1
			}],
			options: [{
				id: testOption.id,
				quantity: 1
			}]
		}
	})

	it('should create a valid order', async function () {
		const order = await OrderModel.create(testOrderFields)
		expect(order).to.exist
		expect(order.products[0].quantity).to.equal(testOrderFields.products[0].quantity)
		expect(order.options?.[0].quantity).to.equal(testOrderFields.options?.[0].quantity)
	})

	it('should set status to pending by default', async function () {
		const order = await OrderModel.create(testOrderFields)
		expect(order).to.exist
		expect(order.status).to.equal('pending')
	})

	it('should not allow non-integer quantities for products', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [{
					id: testProduct._id,
					quantity: 1.5
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not allow non-integer quantities for options', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [{
					id: testOption._id,
					quantity: 1.5
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should allow no options', async function () {
		const order = await OrderModel.create({
			...testOrderFields,
			options: undefined
		})
		expect(order).to.exist
	})

	it('should require an activity', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				activityId: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not allow an activity that does not exist', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				activityId: new Types.ObjectId()
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
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
		expect(errorOccurred).to.be.true
	})

	it('should not allow products that do not exist', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [{
					id: new Types.ObjectId(),
					quantity: 1
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should require that products are unique', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [
					{
						id: testProduct._id,
						quantity: 1
					},
					{
						id: testProduct._id,
						quantity: 1
					}
				]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should require a quantity for products', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [{
					id: testProduct._id,
					quantity: undefined
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not allow products with a quantity of 0', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [{
					id: testProduct._id,
					quantity: 0
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not allow products with a quantity less than 0', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				products: [{
					id: testProduct._id,
					quantity: -1
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not require options', async function () {
		const order = await OrderModel.create({
			...testOrderFields,
			options: undefined
		})
		expect(order).to.exist
	})

	it('should not allow options that do not exist', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [{
					id: new Types.ObjectId(),
					quantity: 1
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should require that options are unique', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [
					{
						id: testOption._id,
						quantity: 1
					},
					{
						id: testOption._id,
						quantity: 1
					}
				]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should require a quantity for options', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [{
					id: testOption._id,
					quantity: undefined
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not allow options with a quantity of 0', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [{
					id: testOption._id,
					quantity: 0
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not allow options with a quantity less than 0', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [{
					id: testOption._id,
					quantity: -1
				}]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not allow duplicate options in an order', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [
					{
						id: testOption._id,
						quantity: 1
					},
					{
						id: testOption._id,
						quantity: 1
					}
				]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not allow a real and a non-existent option in an order', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				options: [
					{
						id: testOption._id,
						quantity: 1
					},
					{
						id: new Types.ObjectId(),
						quantity: 1
					}
				]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
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
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 12,
						minute: 0
					}
				}
			})

			testProductAfterLunch = await ProductModel.create({
				name: 'After Lunch',
				price: 100,
				orderWindow: {
					from: {
						hour: 12,
						minute: 0
					},
					to: {
						hour: 23,
						minute: 59
					}
				}
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
						id: testProductAfterLunch._id,
						quantity: 1
					}]
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
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
						id: testProductBeforeLunch._id,
						quantity: 1
					}]
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should allow products to be ordered deep within the order window before lunch', async function () {
			// Set the fake time to a specific date and time that is before lunch
			const fakeTime = new Date('2024-04-21T10:00:00Z').getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			const order = await OrderModel.create({
				...testOrderFields,
				products: [{
					id: testProductBeforeLunch._id,
					quantity: 1
				}]
			})
			expect(order).to.exist
		})

		it('should allow products to be ordered deep within the order window after lunch', async function () {
			// Set the fake time to a specific date and time that is after lunch
			const fakeTime = new Date('2024-04-21T14:00:00Z').getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			const order = await OrderModel.create({
				...testOrderFields,
				products: [{
					id: testProductAfterLunch._id,
					quantity: 1
				}]
			})
			expect(order).to.exist
		})

		it('should allow products to be ordered within the last hour of the order window', async function () {
			// Set the fake time to a specific date and time that is within the last hour of the order window
			const fakeTime = new Date('2024-04-21T11:59:00Z').getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			const order = await OrderModel.create({
				...testOrderFields,
				products: [{
					id: testProductBeforeLunch._id,
					quantity: 1
				}]
			})
			expect(order).to.exist
		})

		it('should allow products to be ordered within the first hour of the order window', async function () {
			// Set the fake time to a specific date and time that is within the first hour of the order window
			const fakeTime = new Date('2024-04-21T12:01:00Z').getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			const order = await OrderModel.create({
				...testOrderFields,
				products: [{
					id: testProductAfterLunch._id,
					quantity: 1
				}]
			})
			expect(order).to.exist
		})
	})
})
