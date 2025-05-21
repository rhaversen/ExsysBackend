/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'

import ActivityModel from '../../../app/models/Activity.js'
import KioskModel from '../../../app/models/Kiosk.js'
import OrderModel from '../../../app/models/Order.js'
import ProductModel from '../../../app/models/Product.js'
import RoomModel from '../../../app/models/Room.js'
import { getChaiAgent as agent } from '../../testSetup.js'

describe('Reader Callback routes', function () {
	describe('POST /v1/reader-callback', function () {
		beforeEach(async function () {
			const testProduct = await ProductModel.create({
				name: 'Test Product',
				price: 10,
				orderWindow: { from: { hour: 0, minute: 0 }, to: { hour: 23, minute: 59 } }
			})
			const testRoom = await RoomModel.create({ name: 'Test Room', description: 'Test Room Description' })
			const testActivity = await ActivityModel.create({ name: 'Test Activity', roomId: testRoom.id })
			const testKiosk = await KioskModel.create({
				name: 'Test Kiosk'
			})
			await OrderModel.create({
				checkoutMethod: 'sumUp',
				payment: {
					clientTransactionId: '54321',
					paymentStatus: 'pending'
				},
				products: [{ id: testProduct.id, quantity: 1 }],
				roomId: testRoom.id,
				activityId: testActivity.id,
				kioskId: testKiosk.id
			})
		})

		it('should have status 200 when updating a payment status', async function () {
			const response = await agent().post('/api/v1/reader-callback').send({
				id: '12345',
				event_type: 'payment_status_updated',
				payload: {
					client_transaction_id: '54321',
					merchant_code: '12345',
					status: 'successful',
					transaction_id: '54321'
				},
				timestamp: '2021-08-20T15:00:00Z'
			})

			expect(response.status).to.equal(200)
		})

		it('should update the payment status to successful', async function () {
			await agent().post('/api/v1/reader-callback').send({
				id: '12345',
				event_type: 'payment_status_updated',
				payload: {
					client_transaction_id: '54321',
					merchant_code: '12345',
					status: 'successful',
					transaction_id: '54321'
				},
				timestamp: '2021-08-20T15:00:00Z'
			})

			const order = await OrderModel.findOne({ 'payment.clientTransactionId': '54321' })

			expect(order).to.exist
			expect(order?.payment).to.have.property('paymentStatus', 'successful')
		})

		it('should update the payment status to failed', async function () {
			await agent().post('/api/v1/reader-callback').send({
				id: '12345',
				event_type: 'payment_status_updated',
				payload: {
					client_transaction_id: '54321',
					merchant_code: '12345',
					status: 'failed',
					transaction_id: '54321'
				},
				timestamp: '2021-08-20T15:00:00Z'
			})

			const order = await OrderModel.findOne({ 'payment.clientTransactionId': '54321' })

			expect(order).to.exist
			expect(order?.payment).to.have.property('paymentStatus', 'failed')
		})

		it('should update the payment status of the correct payment', async function () {
			const testProduct2 = await ProductModel.create({
				name: 'Test Product 2',
				price: 20,
				orderWindow: { from: { hour: 0, minute: 0 }, to: { hour: 23, minute: 59 } }
			})
			const testRoom2 = await RoomModel.create({ name: 'Test Room 2', description: 'Test Room 2 Description' })
			const testActivity2 = await ActivityModel.create({ name: 'Test Activity 2', roomId: testRoom2.id })
			const anotherKiosk = await KioskModel.create({
				name: 'Another Test Kiosk'
			})

			await OrderModel.create({
				checkoutMethod: 'sumUp',
				payment: {
					clientTransactionId: '12345', // Different clientTransactionId
					paymentStatus: 'pending'
				},
				products: [{ id: testProduct2.id, quantity: 1 }], // Corrected to use testProduct2
				roomId: testRoom2.id,
				activityId: testActivity2.id,
				kioskId: anotherKiosk.id
			})

			await agent().post('/api/v1/reader-callback').send({
				id: '12345',
				event_type: 'payment_status_updated',
				payload: {
					client_transaction_id: '54321', // Targeting the first order
					merchant_code: '12345',
					status: 'successful',
					transaction_id: '54321'
				},
				timestamp: '2021-08-20T15:00:00Z'
			})

			const updatedOrder = await OrderModel.findOne({ 'payment.clientTransactionId': '54321' })
			expect(updatedOrder).to.exist
			expect(updatedOrder?.payment).to.have.property('paymentStatus', 'successful')

			const pendingOrder = await OrderModel.findOne({ 'payment.clientTransactionId': '12345' })
			expect(pendingOrder).to.exist
			expect(pendingOrder?.payment).to.have.property('paymentStatus', 'pending')
		})

		it('should have status 200 when the payment does not exist', async function () {
			const response = await agent().post('/api/v1/reader-callback').send({
				id: '12345',
				event_type: 'payment_status_updated',
				payload: {
					client_transaction_id: 'nonexistent123', // Non-existent client_transaction_id
					merchant_code: '12345',
					status: 'successful',
					transaction_id: '54321'
				},
				timestamp: '2021-08-20T15:00:00Z'
			})

			expect(response.status).to.equal(200)
			expect(response.body).to.have.property('message', 'Order with payment not found, callback ignored.')
		})
	})
})
