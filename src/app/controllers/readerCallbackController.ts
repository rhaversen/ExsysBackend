import { type Request, type Response } from 'express'

import OrderModel from '../models/Order.js'
import logger from '../utils/logger.js'

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
		// Find the order containing the payment using clientTransactionId
		const order = await OrderModel.findOne({ 'payment.clientTransactionId': clientTransactionId })

		if (!order) {
			// Order not found, might be an old/invalid callback or race condition
			logger.warn(`Reader callback: Order not found for payment with Client Tx ID ${clientTransactionId}. Event ID: ${eventId}. Ignoring.`)
			res.status(200).json({ message: 'Order with payment not found, callback ignored.' }) // Acknowledge receipt
			return
		}

		// Check if payment status is already final to prevent redundant updates/events
		if (order.payment.paymentStatus === 'successful' || order.payment.paymentStatus === 'failed') {
			logger.info(`Reader callback: Payment for Order ID ${order._id} already has final status "${order.payment.paymentStatus}". Ignoring update to "${sumUpStatus}". Event ID: ${eventId}`)
			res.status(200).json({ message: 'Payment already in final state, callback ignored.' }) // Acknowledge receipt
			return
		}

		// Update payment status within the order
		logger.info(`Updating payment status for Order ID ${order._id} from "${order.payment.paymentStatus}" to "${sumUpStatus}". Event ID: ${eventId}`)
		order.payment.paymentStatus = sumUpStatus

		await order.save() // Save the updated order document
		logger.debug(`Order's payment status saved successfully for Order ID ${order._id}`)

		// Respond 200 OK to SumUp immediately after saving
		res.status(200).send()
	} catch (error) {
		logger.error(`Reader callback processing failed for Client Tx ID ${clientTransactionId}, Event ID ${eventId}`, { error })
		// Do NOT send error response to SumUp here, as we already sent 200 OK.
		// The error is logged for internal investigation.
	}
}
