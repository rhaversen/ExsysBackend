/* eslint-disable typescript/no-unused-vars */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { describe, it } from 'mocha'
import { expect } from 'chai'

// Own modules
import { chaiAppServer as agent } from '../../testSetup.js'
import PaymentModel from '../../../app/models/Payment.js'

describe('Reader Callback routes', function () {
	describe('POST /v1/reader-callback', function () {
		beforeEach(async function () {
			// Create a paymentStatus to update later
			await PaymentModel.create({
				clientTransactionId: '54321',
				paymentStatus: 'pending'
			})
		})

		it('should have status 200 when updating a payment status', async function () {
			const response = await agent.post('/api/v1/reader-callback').send({
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
			await agent.post('/api/v1/reader-callback').send({
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

			const payment = await PaymentModel.findOne({ clientTransactionId: '54321' })

			expect(payment).to.exist
			expect(payment).to.have.property('paymentStatus', 'successful')
		})

		it('should update the payment status to failed', async function () {
			await agent.post('/api/v1/reader-callback').send({
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

			const payment = await PaymentModel.findOne({ clientTransactionId: '54321' })

			expect(payment).to.exist
			expect(payment).to.have.property('paymentStatus', 'failed')
		})

		it('should update the payment status of the correct payment', async function () {
			await PaymentModel.create({
				clientTransactionId: '12345',
				paymentStatus: 'pending'
			})

			await agent.post('/api/v1/reader-callback').send({
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

			const updatedPayment = await PaymentModel.findOne({ clientTransactionId: '54321' })

			expect(updatedPayment).to.exist
			expect(updatedPayment).to.have.property('paymentStatus', 'successful')

			const pendingPayment = await PaymentModel.findOne({ clientTransactionId: '12345' })

			expect(pendingPayment).to.exist
			expect(pendingPayment).to.have.property('paymentStatus', 'pending')
		})

		it('should have status 404 when the payment does not exist', async function () {
			const response = await agent.post('/api/v1/reader-callback').send({
				id: '12345',
				event_type: 'payment_status_updated',
				payload: {
					client_transaction_id: '12345',
					merchant_code: '12345',
					status: 'successful',
					transaction_id: '54321'
				},
				timestamp: '2021-08-20T15:00:00Z'
			})

			expect(response.status).to.equal(404)
		})
	})
})
