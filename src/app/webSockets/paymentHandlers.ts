// Node.js built-in modules

// Third-party libraries

// Own modules
import { type IPayment } from '../models/Payment.js'
import { emitSocketEvent } from '../utils/socket.js'
import { type IOrder } from '../models/Order.js'

// Environment variables

// Config variables

// Destructuring and global variables

// Function to notify all clients about payment status updates
export async function emitPaymentStatusUpdate (payment: IPayment, order: IOrder): Promise<void> {
	const payload = {
		orderId: order.id,
		paymentStatus: payment.paymentStatus
	}

	emitSocketEvent<{ orderId: string, paymentStatus: string }>(
		'paymentStatusUpdated',
		payload,
		`Broadcasted payment status update for order ${payload.orderId}`
	)
}
