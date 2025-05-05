/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'
import { Types } from 'mongoose'
import sinon from 'sinon'

import ActivityModel, { type IActivity } from '../../../app/models/Activity.js'
import KioskModel from '../../../app/models/Kiosk.js'
import OptionModel, { type IOption } from '../../../app/models/Option.js'
import OrderModel, { IOrder } from '../../../app/models/Order.js'
import PaymentModel from '../../../app/models/Payment.js'
import ProductModel, { type IProduct } from '../../../app/models/Product.js'
import ReaderModel from '../../../app/models/Reader.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'

import '../../testSetup.js'

describe('Order Model', function () {
	let testProduct: IProduct
	let testRoom: IRoom
	let testActivity: IActivity
	let testOption: IOption
	let testOrderFields: {
		paymentId: Types.ObjectId
		kioskId?: Types.ObjectId | null
		activityId: Types.ObjectId
		roomId: Types.ObjectId
		products: Array<{
			id: Types.ObjectId
			quantity: number
		}>
		options?: Array<{
			id: Types.ObjectId
			quantity: number
		}>
		checkoutMethod: 'sumup' | 'mobilePay' | 'later' | 'manual'
	}

	beforeEach(async function () {
		// Set the fake time to a specific date and time that is before lunch
		// Use local time constructor: new Date(year, monthIndex, day, hours, minutes, seconds)
		const fakeTime = new Date(2024, 3, 21, 10, 0, 0).getTime() // April 21st, 10:00 local time
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

		const testReader = await ReaderModel.create({
			apiReferenceId: '12345',
			readerTag: '12345'
		})

		const testKiosk = await KioskModel.create({
			name: 'Test Kiosk',
			password: 'Test Password',
			readerId: testReader.id
		})

		const testPayment = await PaymentModel.create({})

		testOrderFields = {
			paymentId: testPayment.id,
			kioskId: testKiosk.id,
			activityId: testActivity.id,
			roomId: testRoom.id,
			products: [{
				id: testProduct.id,
				quantity: 1
			}],
			options: [{
				id: testOption.id,
				quantity: 1
			}],
			checkoutMethod: 'later'
		}
	})

	it('should create a valid order', async function () {
		const order = await OrderModel.create(testOrderFields)
		expect(order).to.exist
		expect(order.products[0].quantity).to.equal(testOrderFields.products[0].quantity)
		expect(order.options?.[0].quantity).to.equal(testOrderFields.options?.[0].quantity)
		expect(order.checkoutMethod).to.equal(testOrderFields.checkoutMethod)
	})

	it('should allow kioskId to be null', async function () {
		const order = await OrderModel.create({
			...testOrderFields,
			kioskId: null
		})
		expect(order).to.exist
		expect(order.kioskId).to.be.null
	})

	it('should allow kioskId to be undefined (will default to null)', async function () {
		const order = await OrderModel.create({
			...testOrderFields,
			kioskId: undefined
		})
		expect(order).to.exist
		expect(order.kioskId).to.be.null
	})

	it('should not allow a non-existent kioskId if provided', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				kioskId: new Types.ObjectId() // Non-existent ID
			})
		} catch {
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create an order with a valid product and a non-existent product', async function () {
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
						id: new Types.ObjectId(),
						quantity: 1
					}
				]
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create an order with a valid option and a non-existent option', async function () {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should require a room', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				roomId: undefined
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not allow a room that does not exist', async function () {
		let errorOccurred = false
		try {
			await OrderModel.create({
				...testOrderFields,
				roomId: new Types.ObjectId()
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	describe('Order Window Validation', function () {
		let testProductBeforeLunch: IProduct
		let testProductAfterLunch: IProduct
		let testProductAcrossMidnight: IProduct

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

			testProductAcrossMidnight = await ProductModel.create({
				name: 'Across Midnight',
				price: 100,
				orderWindow: {
					from: {
						hour: 20,
						minute: 0
					},
					to: {
						hour: 4,
						minute: 0
					}
				}
			})
		})

		it('should not allow products to be ordered before the order window', async function () {
			// Set the fake time to a specific date and time that is before lunch (10:00 local)
			const fakeTime = new Date(2024, 3, 21, 10, 0, 0).getTime()
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
			} catch {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should not allow products to be ordered after the order window', async function () {
			// Set the fake time to a specific date and time that is after lunch (14:00 local)
			const fakeTime = new Date(2024, 3, 21, 14, 0, 0).getTime()
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
			} catch {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should allow products to be ordered deep within the order window before lunch', async function () {
			// Set the fake time to a specific date and time that is before lunch (10:00 local)
			const fakeTime = new Date(2024, 3, 21, 10, 0, 0).getTime()
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
			// Set the fake time to a specific date and time that is after lunch (14:00 local)
			const fakeTime = new Date(2024, 3, 21, 14, 0, 0).getTime()
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
			// Set the fake time to a specific date and time that is within the last hour of the order window (11:59 local)
			const fakeTime = new Date(2024, 3, 21, 11, 59, 0).getTime()
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
			// Set the fake time to a specific date and time that is within the first hour of the order window (12:01 local)
			const fakeTime = new Date(2024, 3, 21, 12, 1, 0).getTime()
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

		it('should allow products to be ordered at the exact start of the order window', async function () {
			// Set the fake time to a specific date and time that is at the exact start of the order window (12:00 local)
			const fakeTime = new Date(2024, 3, 21, 12, 0, 0).getTime()
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

		it('should allow products to be ordered at the exact end of the order window', async function () {
			// Set the fake time to a specific date and time that is at the exact end of the order window (12:00 local)
			const fakeTime = new Date(2024, 3, 21, 12, 0, 0).getTime()
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

		it('should allow products to be ordered inside the order window before midnight when the order window is moves across midnight', async function () {
			// Set the fake time to a specific date and time that is before midnight (21:00 local)
			const fakeTime = new Date(2024, 3, 21, 21, 0, 0).getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			const order = await OrderModel.create({
				...testOrderFields,
				products: [{
					id: testProductAcrossMidnight._id,
					quantity: 1
				}]
			})
			expect(order).to.exist
		})

		it('should allow products to be ordered inside the order window after midnight when the order window moves across midnight', async function () {
			// Set the fake time to a specific date and time that is after midnight (03:00 local)
			const fakeTime = new Date(2024, 3, 21, 3, 0, 0).getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			const order = await OrderModel.create({
				...testOrderFields,
				products: [{
					id: testProductAcrossMidnight._id,
					quantity: 1
				}]
			})
			expect(order).to.exist
		})

		it('should not allow products to be ordered when only one is withing the order window', async function () {
			// Set the fake time to a specific date and time that is after lunch (14:00 local)
			const fakeTime = new Date(2024, 3, 21, 14, 0, 0).getTime()
			sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

			let errorOccurred = false
			try {
				await OrderModel.create({
					...testOrderFields,
					products: [
						{
							id: testProductBeforeLunch._id,
							quantity: 1
						},
						{
							id: testProductAfterLunch._id,
							quantity: 1
						}
					]
				})
			} catch {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		describe('Order Status Updates', function () {
			let testOrder: IOrder

			beforeEach(async function () {
				// Set the fake time to a specific date and time that is before lunch (10:00 local)
				sinon.restore() // Restore the JavaScript environment's time
				const fakeTime = new Date(2024, 3, 21, 10, 0, 0).getTime()
				sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

				testOrder = await OrderModel.create({
					...testOrderFields,
					products: [{
						id: testProductBeforeLunch._id,
						quantity: 1
					}]
				})
			})

			it('should allow order status to be updated to confirmed after the order window has passed', async function () {
				// Set the fake time to a specific date and time that is after lunch (14:00 local)
				sinon.restore() // Restore the JavaScript environment's time
				const fakeTime = new Date(2024, 3, 21, 14, 0, 0).getTime()
				sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

				testOrder.status = 'confirmed'
				await testOrder.save()

				expect(testOrder.status).to.equal('confirmed')
			})

			it('should allow order status to be updated to delivered after the order window has passed', async function () {
				// Set the fake time to a specific date and time that is after lunch (14:00 local)
				sinon.restore() // Restore the JavaScript environment's time
				const fakeTime = new Date(2024, 3, 21, 14, 0, 0).getTime()
				sinon.useFakeTimers(fakeTime) // Fake the JavaScript environment's time

				testOrder.status = 'delivered'
				await testOrder.save()

				expect(testOrder.status).to.equal('delivered')
			})
		})
	})
})
