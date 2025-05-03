import { IOrderFrontend } from '../models/Order.js'
import logger from '../utils/logger.js'
import { emitSocketEvent } from '../utils/socket.js'

export async function emitPaidOrderPosted (order: IOrderFrontend): Promise<void> {
	try {
		// Emit the event using the generic emit function
		emitSocketEvent<IOrderFrontend>(
			'orderCreated',
			order,
			`Broadcasted paid order posted for order ${order._id}`
		)
	} catch (error) {
		logger.error(error)
	}
}

export async function emitOrderStatusUpdated (order: IOrderFrontend): Promise<void> {
	try {
		// Emit the event using the generic emit function
		emitSocketEvent<IOrderFrontend>(
			'orderStatusUpdated',
			order,
			`Broadcasted order status updated for order ${order._id}`
		)
	} catch (error) {
		logger.error(error)
	}
}
