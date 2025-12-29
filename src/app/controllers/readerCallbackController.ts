import { type Request, type Response } from 'express'
import mongoose from 'mongoose'

import OrderModel, { IOrder } from '../models/Order.js'
import logger from '../utils/logger.js'

interface ICreateCheckoutCallback extends Request {
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

interface IDebugPaymentCallback extends Request {
	body: {
		orderId: string
		status: 'successful' | 'failed'
	}
}

type PaymentStatus = 'successful' | 'failed'

function isPaymentStatus (status: string): status is PaymentStatus {
	return ['successful', 'failed'].includes(status)
}

interface UpdateResult {
	success: boolean
	message: string
	alreadyFinal?: boolean
}

async function processPaymentStatusUpdate (order: IOrder, newStatus: PaymentStatus, logContext: string): Promise<UpdateResult> {
	if (order.payment.paymentStatus === 'successful' || order.payment.paymentStatus === 'failed') {
		logger.info(`${logContext}: Payment for Order ID ${order._id} already has final status "${order.payment.paymentStatus}". Ignoring update to "${newStatus}".`)
		return { success: true, message: 'Payment already in final state, callback ignored.', alreadyFinal: true }
	}

	logger.info(`${logContext}: Updating payment status for Order ID ${order._id} from "${order.payment.paymentStatus}" to "${newStatus}"`)
	order.payment.paymentStatus = newStatus

	await order.save()
	logger.debug(`${logContext}: Order's payment status saved successfully for Order ID ${order._id}`)

	return { success: true, message: `Payment status updated to '${newStatus}'` }
}

export async function updatePaymentStatus (req: ICreateCheckoutCallback, res: Response): Promise<void> {
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

		const result = await processPaymentStatusUpdate(order, sumUpStatus, `Reader callback (Event ID: ${eventId})`)
		res.status(200).json({ message: result.message })
	} catch (error) {
		logger.error(`Reader callback processing failed for Client Tx ID ${clientTransactionId}, Event ID ${eventId}`, { error })
		res.status(200).json({ message: 'Callback processing failed' })
	}
}

export async function debugUpdatePaymentStatus (req: IDebugPaymentCallback, res: Response): Promise<void> {
	const { orderId, status } = req.body

	logger.info(`Debug: Simulating payment callback for Order ID ${orderId} with status ${status}`)

	if (!orderId || typeof orderId !== 'string' || !mongoose.Types.ObjectId.isValid(orderId)) {
		logger.warn(`Debug callback: Invalid or missing orderId: ${orderId}`)
		res.status(400).json({ error: 'Invalid or missing orderId' })
		return
	}
	if (typeof status !== 'string' || !isPaymentStatus(status)) {
		logger.warn(`Debug callback: Invalid status "${status}" for Order ID: ${orderId}`)
		res.status(400).json({ error: 'Invalid status. Must be \'successful\' or \'failed\'' })
		return
	}

	try {
		const order = await OrderModel.findById(orderId)

		if (!order) {
			logger.warn(`Debug callback: Order not found. ID: ${orderId}`)
			res.status(404).json({ error: 'Order not found' })
			return
		}

		const result = await processPaymentStatusUpdate(order, status, 'Debug callback')
		res.status(200).json({ message: result.message })
	} catch (error) {
		logger.error(`Debug callback processing failed for Order ID ${orderId}`, { error })
		res.status(500).json({ error: 'Failed to update payment status' })
	}
}
