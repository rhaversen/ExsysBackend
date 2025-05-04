import { type IOrderPopulated } from '../models/Order.js'
import { type IPayment } from '../models/Payment.js'
import { emitSocketEvent } from '../utils/socket.js'

// Function to notify all clients about payment status updates
export async function emitPaymentStatusUpdate (payment: IPayment, order: IOrderPopulated): Promise<void> {
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
