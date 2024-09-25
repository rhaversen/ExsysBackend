// Node.js built-in modules

// Own modules
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import { type IOrder, type IOrderWithNamesPopulatedPaymentId } from '../models/Order.js'

// Third-party libraries

export async function emitOrderPosted (order: IOrder): Promise<void> {
	const io = getSocket()

	try {
		// Populate the necessary fields
		const populatedOrders = await order.populate([
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
		]) as unknown as IOrderWithNamesPopulatedPaymentId | null

		const transformedProducts = populatedOrders?.products.map(product => {
			return {
				_id: product.id._id,
				name: product.id.name,
				quantity: product.quantity
			}
		})
		const transformedOptions = populatedOrders?.options?.map((option: any) => {
			return {
				_id: option.id._id,
				name: option.id.name,
				quantity: option.quantity
			}
		})

		const transformedOrder = {
			...order.toObject(),
			products: transformedProducts,
			options: transformedOptions,
			paymentId: undefined
		}

		io.emit('orderCreated', transformedOrder)

		logger.silly(`Broadcasted order posted for order ${order.id}`)
	} catch (error) {
		logger.error(error)
	}
}
