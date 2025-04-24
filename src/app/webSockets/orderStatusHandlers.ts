// Node.js built-in modules

// Third-party libraries

// Own modules
import logger from '../utils/logger.js'
import { emitSocketEvent } from '../utils/socket.js'
import { IOrderFrontend } from '../models/Order.js'

// Environment variables

// Config variables

// Destructuring and global variables

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
