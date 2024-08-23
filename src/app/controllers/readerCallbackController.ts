// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import PaymentModel from '../models/Payment.js'

interface ICreateReaderCallback extends Request {
	body: {
		id: string
		event_type: string
		payload: {
			client_transaction_id: string
			merchant_code: string
			status: 'successful' | 'failed'
			transaction_id: string | null
		}
		timestamp: string
	}
}

function isPaymentStatus (status: string): status is 'successful' | 'failed' {
	return ['successful', 'failed', 'pending'].includes(status)
}

export async function updatePaymentStatus (req: ICreateReaderCallback, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Updating payment')

	// Create a new object with only the allowed fields
	const {
		client_transaction_id: clientTransactionId,
		status
	}: Record<string, unknown> = req.body.payload

	try {
		const payment = await PaymentModel.findOne({ clientTransactionId })
		if (payment === null || payment.clientTransactionId !== clientTransactionId) {
			res.status(404).json({ error: 'Payment not found' })
			return
		}
		if (typeof status !== 'string' || !isPaymentStatus(status)) {
			res.status(400).json({ error: 'Invalid status' })
			return
		}

		payment.paymentStatus = status

		await payment.save()

		res.status(200).send()
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
