import { type Request, type Response } from 'express'

import OrderModel, { IOrderPopulated } from '../models/Order.js'
import PaymentModel from '../models/Payment.js'
import logger from '../utils/logger.js'
import { emitPaidOrderPosted } from '../webSockets/orderStatusHandlers.js'
import { emitPaymentStatusUpdate } from '../webSockets/paymentHandlers.js'

import { transformOrder } from './orderController.js'

interface ICreateReaderCallback extends Request {
	body: {
		id: string // Event ID
		event_type: string // e.g., 'payment.updated'
		payload: {
			client_transaction_id: string // Our Payment._id
			merchant_code: string
			status: 'successful' | 'failed' // SumUp status
			transaction_id: string | null // SumUp's transaction ID
		}
		timestamp: string // ISO 8601 timestamp
	}
}

function isPaymentStatus (status: string): status is 'successful' | 'failed' {
	return ['successful', 'failed'].includes(status)
}

export async function updatePaymentStatus (req: ICreateReaderCallback, res: Response): Promise<void> {
	const eventId = req.body.id
	const eventType = req.body.event_type
	const {
		client_transaction_id: clientTransactionId,
		status: sumUpStatus
	} = req.body.payload

	logger.info(`Received reader callback: Event ID ${eventId}, Type ${eventType}, Client Tx ID ${clientTransactionId}, Status ${sumUpStatus}`)

	// --- Input Validation ---
	if (!clientTransactionId || typeof clientTransactionId !== 'string') {
		logger.warn(`Reader callback ignored: Missing or invalid client_transaction_id. Event ID: ${eventId}`)
		// Respond 2xx to acknowledge receipt but indicate no action taken due to bad data
		res.status(200).json({ message: 'Callback received but ignored due to missing client_transaction_id' })
		return
	}
	if (typeof sumUpStatus !== 'string' || !isPaymentStatus(sumUpStatus)) {
		logger.warn(`Reader callback ignored: Invalid status "${sumUpStatus}". Event ID: ${eventId}, Client Tx ID: ${clientTransactionId}`)
		res.status(200).json({ message: `Callback received but ignored due to invalid status: ${sumUpStatus}` })
		return
	}
	// --- End Input Validation ---

	try {
		// Find the payment using our ID (clientTransactionId from SumUp's perspective)
		const payment = await PaymentModel.findOne({ clientTransactionId })

		if (!payment) {
			// Payment not found, might be an old/invalid callback or race condition
			logger.warn(`Reader callback: Payment not found for Client Tx ID ${clientTransactionId}. Event ID: ${eventId}. Ignoring.`)
			res.status(200).json({ message: 'Payment not found, callback ignored.' }) // Acknowledge receipt
			return
		}

		// Check if status is already final to prevent redundant updates/events
		if (payment.paymentStatus === 'successful' || payment.paymentStatus === 'failed') {
			logger.info(`Reader callback: Payment ID ${payment.id} already has final status "${payment.paymentStatus}". Ignoring update to "${sumUpStatus}". Event ID: ${eventId}`)
			res.status(200).json({ message: 'Payment already in final state, callback ignored.' }) // Acknowledge receipt
			return
		}

		// Update payment status
		logger.info(`Updating payment status for Payment ID ${payment.id} from "${payment.paymentStatus}" to "${sumUpStatus}". Event ID: ${eventId}`)
		payment.paymentStatus = sumUpStatus

		await payment.save()
		logger.debug(`Payment status saved successfully for Payment ID ${payment.id}`)

		// Respond 200 OK to SumUp immediately after saving
		res.status(200).send()

		// --- Post-Update Actions (WebSockets, etc.) ---
		// Find the associated order(s)
		// Use lean() for performance as we only read data for events
		const order = await OrderModel.findOne({ paymentId: payment.id })
			.populate([
				{ path: 'paymentId', select: 'paymentStatus clientTransactionId id' },
				{ path: 'products.id', select: 'name _id' },
				{ path: 'options.id', select: 'name _id' }
			])
			.lean() // Use lean
			.exec() as unknown as IOrderPopulated | null

		if (order) {
			logger.debug(`Found associated Order ID ${order._id} for Payment ID ${payment.id}`)
			// Emit payment status update via WebSocket
			await emitPaymentStatusUpdate(payment, order)

			// If payment was successful, emit the paid order event
			if (sumUpStatus === 'successful') {
				logger.info(`Payment successful for Order ID ${order._id}. Emitting paid order event.`)
				const transformedOrder = transformOrder(order) // Transform the lean object
				await emitPaidOrderPosted(transformedOrder)
			}
		} else {
			// This might happen if an order was deleted after payment started but before callback
			logger.warn(`Reader callback: No order found associated with Payment ID ${payment.id}. Event ID: ${eventId}`)
		}
		// --- End Post-Update Actions ---
	} catch (error) {
		logger.error(`Reader callback processing failed for Client Tx ID ${clientTransactionId}, Event ID ${eventId}`, { error })
		// Do NOT send error response to SumUp here, as we already sent 200 OK.
		// The error is logged for internal investigation.
	}
}
