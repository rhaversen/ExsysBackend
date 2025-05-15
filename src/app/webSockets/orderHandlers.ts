import { IOrderFrontend } from '../models/Order.js'
import { emitSocketEvent } from '../utils/socket.js'

export function emitOrderCreated (order: IOrderFrontend): void {
	emitSocketEvent<IOrderFrontend>(
		'orderCreated',
		order,
		`Broadcasted order created for order ${order._id}`
	)
}

export function emitOrderUpdated (order: IOrderFrontend): void {
	emitSocketEvent<IOrderFrontend>(
		'orderUpdated',
		order,
		`Broadcasted order updated for order ${order._id}`
	)
}

export function emitOrderDeleted (orderId: string): void {
	emitSocketEvent<string>(
		'orderDeleted',
		orderId,
		`Broadcasted order deleted for order ${orderId}`
	)
}
