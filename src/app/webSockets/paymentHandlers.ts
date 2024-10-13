// Node.js built-in modules

// Own modules
import { type IPayment } from '../models/Payment.js'
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import { type IOrder } from '../models/Order.js'

// Third-party libraries

// Function to notify all clients about payment status updates
export async function emitPaymentStatusUpdate (payment: IPayment, order: IOrder): Promise<void> {
	const payload = {
		orderId: order.id,
		paymentStatus: payment.paymentStatus
	}

	io.emit('paymentStatusUpdated', {
		orderId,
		paymentStatus: payment.paymentStatus
	})

	logger.silly(`Broadcasted payment status update for order ${orderId}`)
}
