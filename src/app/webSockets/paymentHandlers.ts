// Node.js built-in modules

// Own modules
import { type IPayment } from '../models/Payment.js'
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import OrderModel from '../models/Order.js'

// Third-party libraries

// Function to notify all clients about payment status updates
export async function emitPaymentStatusUpdate (payment: IPayment): Promise<void> {
	const io = getSocket()
	const { id: paymentId } = payment

	try {
		// Find the order related to this payment
		const order = await OrderModel.findOne({ paymentId }).exec()

		if (order === null) {
			logger.warn(`No orders found for paymentId ${paymentId}`)
			return
		}

		const orderId = order.id as string

		// Emit the update to all connected clients
		io.emit('paymentStatusUpdated', {
			orderId,
			paymentStatus: payment.paymentStatus
		})

		logger.silly(`Broadcasted payment status update for order ${orderId}`)
	} catch (error) {
		logger.error(error)
	}
}
