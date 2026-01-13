/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import mongoose from 'mongoose'
import sinon from 'sinon'

import ActivityModel from '../../../app/models/Activity.js'
import KioskModel from '../../../app/models/Kiosk.js'
import OptionModel from '../../../app/models/Option.js'
import OrderModel, { IOrderFrontend } from '../../../app/models/Order.js'
import ProductModel from '../../../app/models/Product.js'
import RoomModel from '../../../app/models/Room.js'
import { socketEmitters } from '../../../app/utils/socket.js'

describe('Order WebSocket Emitters', function () {
	let emitSocketEventSpy: sinon.SinonSpy

	let activityId: string
	let roomId: string
	let kioskId: string
	let productId: string
	let optionId: string

	beforeEach(async function () {
		if (mongoose.connection.db !== undefined) {
			await mongoose.connection.db.dropDatabase()
		}

		const room = await RoomModel.create({ name: 'Test Room', description: 'Test Description' })
		roomId = room._id.toString()

		const product = await ProductModel.create({
			name: 'Test Product',
			price: 100,
			orderWindow: {
				from: { hour: 0, minute: 0 },
				to: { hour: 23, minute: 59 }
			}
		})
		productId = product._id.toString()

		const option = await OptionModel.create({ name: 'Test Option', price: 10 })
		optionId = option._id.toString()

		const activity = await ActivityModel.create({
			name: 'Test Activity',
			enabledRooms: [roomId]
		})
		activityId = activity._id.toString()

		const kiosk = await KioskModel.create({
			name: 'Test Kiosk',
			kioskTag: '12345'
		})
		kioskId = kiosk._id.toString()

		emitSocketEventSpy = sinon.spy(socketEmitters, 'emitSocketEvent')
	})

	afterEach(function () {
		sinon.restore()
	})

	describe('Create Operations', function () {
		it('should emit "orderCreated" via Model.create()', async function () {
			const orderData = {
				activityId,
				roomId,
				kioskId,
				products: [{ id: productId, quantity: 2 }],
				options: [{ id: optionId, quantity: 1 }],
				status: 'pending',
				checkoutMethod: 'sumUp',
				payment: {
					paymentStatus: 'pending',
					clientTransactionId: 'tx-123'
				}
			}
			const order = await OrderModel.create(orderData)

			const expectedOrderFrontend: Partial<IOrderFrontend> = {
				_id: order._id.toString(),
				activityId,
				roomId,
				kioskId,
				status: 'pending',
				paymentStatus: 'pending',
				checkoutMethod: 'sumUp'
			}

			expect(emitSocketEventSpy.calledWith('orderCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedOrderFrontend)
		})

		it('should emit "orderCreated" via new Order().save()', async function () {
			const order = new OrderModel({
				activityId,
				roomId,
				products: [{ id: productId, quantity: 1 }],
				status: 'pending',
				checkoutMethod: 'manual',
				payment: {
					paymentStatus: 'successful'
				}
			})
			await order.save()

			const expectedOrderFrontend: Partial<IOrderFrontend> = {
				_id: order._id.toString(),
				activityId,
				roomId,
				status: 'pending',
				paymentStatus: 'successful',
				checkoutMethod: 'manual'
			}

			expect(emitSocketEventSpy.calledWith('orderCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedOrderFrontend)
		})
	})

	describe('Update Operations', function () {
		it('should emit "orderUpdated" via document.save()', async function () {
			const order = await OrderModel.create({
				activityId,
				roomId,
				products: [{ id: productId, quantity: 1 }],
				status: 'pending',
				checkoutMethod: 'manual',
				payment: {
					paymentStatus: 'successful'
				}
			})

			emitSocketEventSpy.resetHistory()

			order.status = 'confirmed'
			await order.save()

			const expectedOrderFrontend: Partial<IOrderFrontend> = {
				_id: order._id.toString(),
				status: 'confirmed'
			}

			expect(emitSocketEventSpy.calledWith('orderUpdated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedOrderFrontend)
		})

		it('should not emit "orderUpdated" via findByIdAndUpdate()', async function () {
			const order = await OrderModel.create({
				activityId,
				roomId,
				products: [{ id: productId, quantity: 1 }],
				status: 'pending',
				checkoutMethod: 'manual',
				payment: {
					paymentStatus: 'successful'
				}
			})

			emitSocketEventSpy.resetHistory()

			await OrderModel.findByIdAndUpdate(
				order._id,
				{ status: 'confirmed' },
				{ new: true, runValidators: true }
			)

			expect(emitSocketEventSpy.calledWith('orderUpdated')).to.be.false
		})
	})

	describe('Delete Operations', function () {
		it('should emit "orderDeleted" via document.deleteOne() (document-based)', async function () {
			const order = await OrderModel.create({
				activityId,
				roomId,
				products: [{ id: productId, quantity: 1 }],
				status: 'pending',
				checkoutMethod: 'manual',
				payment: {
					paymentStatus: 'successful'
				}
			})
			const orderId = order._id.toString()

			emitSocketEventSpy.resetHistory()

			await order.deleteOne()

			expect(emitSocketEventSpy.calledWith('orderDeleted')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.equal(orderId)
		})
	})
})
