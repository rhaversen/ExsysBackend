// Node.js built-in modules

// Own modules
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import { type IOrder, type IOrderWithNamesPopulatedPaymentId } from '../models/Order.js'

// Third-party libraries

export async function emitPaidOrderPosted (order: IOrder): Promise<void> {
	const io = getSocket()

	try {
		// Populate the necessary fields
		const populatedOrder = (await order.populate([
			{
				path: 'paymentId',
				select: 'paymentStatus'
			},
			{
				path: 'products.id',
				select: 'name'
			},
			{
				path: 'options.id',
				select: 'name'
			}
		])) as unknown as IOrderWithNamesPopulatedPaymentId | null

		// Transform the products to only include the id, name, and quantity, and filter out products without an id
		const transformedProducts = populatedOrder?.products.filter(product => product.id != null).map(product => ({
			_id: product.id._id,
			name: product.id.name,
			quantity: product.quantity
		}))

		// Optionally transform the options to only include the id, name, and quantity, and filter out options without an id
		const transformedOptions = populatedOrder?.options?.filter(option => option.id != null).map(option => ({
			_id: option.id._id,
			name: option.id.name,
			quantity: option.quantity
		}))

		// Construct the transformed order
		const transformedOrder = {
			...order.toObject(),
			products: transformedProducts,
			options: transformedOptions,
			paymentId: undefined
		}

		io.emit('orderCreated', transformedOrder)

		logger.silly(`Broadcasted paid order posted for order ${order.id}`)
	} catch (error) {
		logger.error(error)
	}
}
