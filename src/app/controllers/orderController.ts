import { type NextFunction, type Request, type Response } from 'express'
import mongoose, { type FlattenMaps } from 'mongoose'

import KioskModel, { IKiosk } from '../models/Kiosk.js'
import OptionModel from '../models/Option.js'
import OrderModel, { IOrder, IOrderFrontend, IPayment } from '../models/Order.js' // Import IPayment from Order.js
import ProductModel from '../models/Product.js'
import ReaderModel, { IReader } from '../models/Reader.js'
import { createReaderCheckout, cancelReaderCheckout } from '../services/apiServices.js'
import logger from '../utils/logger.js'

interface OrderItem {
	id: string
	quantity: number
}

// Define a type for the request object in getOrdersWithQuery
interface GetOrdersWithDateRangeRequest extends Request {
	query: {
		fromDate?: string
		toDate?: string
		status?: string // Comma-separated list of statuses
		paymentStatus?: string // Comma-separated list of payment statuses
	}
}

export const transformOrder = (
	order: IOrder | FlattenMaps<IOrder>
): IOrderFrontend => {
	try {
		const products = order.products
			.filter(item => item.id != null) // Filter out items where product might have been deleted
			.map(item => ({ _id: item.id.toString(), quantity: item.quantity }))

		const options = (order.options ?? [])
			.filter(item => item.id != null) // Filter out items where option might have been deleted
			.map(item => ({ _id: item.id.toString(), quantity: item.quantity }))

		if (order.payment == null) {
			logger.error(`Order transformation failed: payment object is missing for order ID ${order._id}`)
			throw new Error('Payment details are missing for order transformation.')
		}

		return {
			_id: order._id.toString(),
			products,
			options,
			activityId: order.activityId.toString(),
			roomId: order.roomId.toString(),
			kioskId: order.kioskId?.toString() ?? null,
			status: order.status ?? 'pending',
			paymentStatus: order.payment.paymentStatus,
			checkoutMethod: order.checkoutMethod,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt
		}
	} catch (error) {
		logger.error(`Error transforming order ID ${order._id}`, { error })
		throw new Error(`Failed to transform order ID ${order._id}: ${error instanceof Error ? error.message : String(error)}`)
	}
}

export function combineItemsById (items: OrderItem[]): OrderItem[] {
	logger.silly(`Combining ${items.length} order items by ID`)
	return items.reduce((accumulator: OrderItem[], currentItem: OrderItem) => {
		const existingItem = accumulator.find(item => item.id === currentItem.id)
		if (existingItem != null) {
			logger.silly(`Combining item ID ${currentItem.id}: ${existingItem.quantity} + ${currentItem.quantity}`)
			existingItem.quantity += currentItem.quantity
		} else {
			accumulator.push({ ...currentItem })
		}
		return accumulator
	}, [])
}

export function removeItemsWithZeroQuantity (items: OrderItem[]): OrderItem[] {
	logger.silly(`Filtering ${items.length} order items, removing zero quantity`)
	return items.filter(item => item.quantity > 0)
}

export async function countSubtotalOfOrder (products: OrderItem[], options: OrderItem[] = []): Promise<number> {
	logger.debug(`Calculating subtotal for ${products.length} products and ${options.length} options`)
	let sum = 0
	try {
		for (const item of products) {
			const itemDoc = await ProductModel.findById(item.id).select('price').lean() // Use lean for performance
			if (itemDoc !== null) {
				const quantity = Math.max(0, Math.floor(item.quantity))
				sum += itemDoc.price * quantity
				logger.silly(`Product ID ${item.id}: ${itemDoc.price} * ${quantity}`)
			} else {
				logger.warn(`Product ID ${item.id} not found during subtotal calculation.`)
			}
		}
		for (const item of options) {
			const itemDoc = await OptionModel.findById(item.id).select('price').lean() // Use lean for performance
			if (itemDoc !== null) {
				const quantity = Math.max(0, Math.floor(item.quantity))
				sum += itemDoc.price * quantity
				logger.silly(`Option ID ${item.id}: ${itemDoc.price} * ${quantity}`)
			} else {
				logger.warn(`Option ID ${item.id} not found during subtotal calculation.`)
			}
		}
		logger.debug(`Calculated subtotal: ${sum}`)
		return sum
	} catch (error) {
		logger.error('Error calculating subtotal', { error })
		throw error // Re-throw to be handled by caller
	}
}

export function isOrderItemList (items: unknown): items is OrderItem[] {
	logger.silly('Validating order item list structure')
	return Array.isArray(items) && items.every((item: unknown): item is OrderItem => {
		const isValid = item !== null &&
			typeof item === 'object' &&
			'id' in item && typeof item.id === 'string' && mongoose.Types.ObjectId.isValid(item.id) && // Check if ID is valid ObjectId
			'quantity' in item && typeof item.quantity === 'number' && item.quantity >= 0 && Number.isInteger(item.quantity)
		if (!isValid) {
			logger.warn('Invalid order item detected:', { item })
		}
		return isValid
	})
}

async function createSumUpCheckout (kioskId: string, subtotal: number): Promise<IPayment | undefined> {
	logger.info(`Attempting to create SumUp checkout for Kiosk ID: ${kioskId}, Subtotal: ${subtotal}`)
	try {
		// Find the reader associated with the kiosk
		const kiosk = await KioskModel.findById(kioskId).select('readerId').lean() // Use lean
		if (!kiosk) {
			logger.error(`SumUp checkout failed: Kiosk not found. ID: ${kioskId}`)
			return undefined
		}
		if (!kiosk.readerId) {
			logger.error(`SumUp checkout failed: Kiosk ID ${kioskId} has no associated reader.`)
			return undefined
		}

		const reader = await ReaderModel.findById(kiosk.readerId).select('apiReferenceId').lean() // Use lean

		if (!reader) {
			logger.error(`SumUp checkout failed: Reader not found for Kiosk ID ${kioskId}. Reader ID: ${kiosk.readerId}`)
			return undefined
		}

		logger.debug(`Found Reader API Ref: ${reader.apiReferenceId} for Kiosk ID: ${kioskId}`)

		// Create a checkout for the reader
		const clientTransactionId = await createReaderCheckout(reader.apiReferenceId, subtotal)

		if (clientTransactionId === undefined) {
			logger.error(`SumUp checkout failed: createReaderCheckout returned undefined for Reader API Ref: ${reader.apiReferenceId}`)
			return undefined
		}
		logger.debug(`SumUp checkout created externally. Client Transaction ID: ${clientTransactionId}`)

		const paymentData: IPayment = {
			clientTransactionId,
			paymentStatus: 'pending'
		}
		logger.info(`Pending payment data prepared for SumUp checkout. Client Transaction ID: ${clientTransactionId}`)
		return paymentData
	} catch (error) {
		logger.error(`Error creating SumUp checkout for Kiosk ID ${kioskId}`, { error })
		return undefined
	}
}

async function createLaterCheckout (): Promise<IPayment> {
	logger.info('Creating "Pay Later" checkout (auto-successful payment)')
	try {
		const paymentData: IPayment = {
			paymentStatus: 'successful' // Pay Later is considered successful immediately
		}
		logger.info('"Pay Later" payment data prepared.')
		return paymentData
	} catch (error) {
		logger.error('Error creating "Pay Later" payment data', { error })
		throw error // Re-throw to be handled by caller
	}
}

async function createManualCheckout (): Promise<IPayment> {
	logger.info('Creating "Manual Entry" checkout (auto-successful payment)')
	try {
		const paymentData: IPayment = {
			paymentStatus: 'successful' // Manual entry is considered successful immediately
		}
		logger.info('"Manual Entry" payment data prepared.')
		return paymentData
	} catch (error) {
		logger.error('Error creating "Manual Entry" payment data', { error })
		throw error // Re-throw to be handled by caller
	}
}

export async function createOrder (req: Request, res: Response, next: NextFunction): Promise<void> {
	const {
		activityId,
		roomId,
		kioskId,
		products,
		options,
		checkoutMethod
	} = req.body as Record<string, unknown>

	logger.info(`Attempting to create order. Kiosk ID: ${kioskId ?? 'Manual/None'}, Activity ID: ${activityId ?? 'N/A'}, Room ID: ${roomId ?? 'N/A'}, Method: ${checkoutMethod ?? 'N/A'}`)

	// --- Input Validation ---
	if (!isOrderItemList(products) || (products.length === 0 && checkoutMethod !== 'manual')) { // Ensure products is a non-empty valid list and only allow empty for manual orders
		logger.warn('Order creation failed: Invalid or empty product data')
		res.status(400).json({ error: 'Invalid or empty product data' })
		return
	}
	if (options !== undefined && !isOrderItemList(options)) { // Allow empty or undefined options, but validate if present
		logger.warn('Order creation failed: Invalid option data')
		res.status(400).json({ error: 'Invalid option data' })
		return
	}
	// Validate kioskId only if it's provided and not null
	if (kioskId != null && (typeof kioskId !== 'string' || !mongoose.Types.ObjectId.isValid(kioskId))) {
		logger.warn(`Order creation failed: Invalid kioskId provided: ${kioskId}`)
		res.status(400).json({ error: 'Invalid kioskId provided' })
		return
	}
	if (typeof activityId !== 'string' || !mongoose.Types.ObjectId.isValid(activityId)) {
		logger.warn('Order creation failed: Invalid or missing activityId')
		res.status(400).json({ error: 'Invalid or missing activityId' })
		return
	}
	if (typeof roomId !== 'string' || !mongoose.Types.ObjectId.isValid(roomId)) {
		logger.warn('Order creation failed: Invalid or missing roomId')
		res.status(400).json({ error: 'Invalid or missing roomId' })
		return
	}
	if (typeof checkoutMethod !== 'string' || !['sumUp', 'later', 'mobilePay', 'manual'].includes(checkoutMethod)) {
		logger.warn(`Order creation failed: Invalid or missing checkoutMethod: ${checkoutMethod ?? 'N/A'}`)
		res.status(400).json({ error: 'Invalid eller manglende checkoutMethod' })
		return
	}

	// Specific validation for manual orders: kioskId must be null/undefined
	if (checkoutMethod === 'manual' && kioskId != null) {
		logger.warn('Order creation failed: kioskId must be null or omitted for manual checkoutMethod.')
		res.status(400).json({ error: 'kioskId must not be provided for manual orders' })
		return
	}
	// Specific validation for non-manual orders: kioskId must be provided
	if (checkoutMethod !== 'manual' && kioskId == null) {
		logger.warn(`Order creation failed: kioskId is required for checkoutMethod '${checkoutMethod}'.`)
		res.status(400).json({ error: `kioskId is required for checkoutMethod '${checkoutMethod}'` })
		return
	}

	// --- End Input Validation ---

	try {
		// Remove items with zero quantity
		const filteredProducts = removeItemsWithZeroQuantity(products ?? [])
		const filteredOptions = removeItemsWithZeroQuantity(options ?? [])

		// Skip check if checkout method is manual
		if (checkoutMethod !== 'manual' && filteredProducts.length === 0) {
			logger.warn('Order creation failed: Order has no products after filtering zero quantity items.')
			res.status(400).json({ error: 'Order must contain at least one product' })
			return
		}

		// Combine the products and options by id
		const combinedProducts = combineItemsById(filteredProducts)
		const combinedOptions = combineItemsById(filteredOptions ?? [])
		logger.debug(`Order items combined: ${combinedProducts.length} products, ${combinedOptions.length} options`)

		// Count the subtotal of the order
		const subtotal = await countSubtotalOfOrder(combinedProducts, combinedOptions)
		if (subtotal < 0) { // Basic sanity check
			logger.error(`Order creation failed: Calculated subtotal is negative (${subtotal}). Aborting.`)
			res.status(500).json({ error: 'Invalid subtotal calculation' })
			return
		}

		let payment: IPayment | undefined

		switch (checkoutMethod) {
			case 'sumUp':
				if (subtotal === 0) {
					logger.warn('Order creation failed: SumUp checkout requested for zero subtotal.')
					res.status(400).json({ error: 'Kan ikke oprette SumUp checkout med subtotal 0' })
					return
				}
				payment = await createSumUpCheckout(kioskId as string, subtotal)
				if (payment === undefined) {
					res.status(500).json({ error: 'Kunne ikke oprette SumUp checkout' })
					return
				}
				break

			case 'later':
				payment = await createLaterCheckout()
				break

			case 'manual':
				payment = await createManualCheckout()
				break

			case 'mobilePay':
				logger.warn('Order creation failed: MobilePay checkout method is not implemented.')
				res.status(501).json({ error: 'MobilePay er ikke implementeret' }) // 501 Not Implemented
				return

			default:
				res.status(400).json({ error: 'Invalid checkout metode' })
				return
		}

		// Create the order
		logger.debug(`Creating order record with embedded payment data. Status: ${payment.paymentStatus}`)
		const newOrder = await OrderModel.create({
			activityId,
			roomId,
			kioskId: kioskId ?? null,
			products: combinedProducts,
			options: combinedOptions,
			payment,
			checkoutMethod,
			status: 'pending'
		})
		logger.info(`Order created successfully: ID ${newOrder.id}`)

		// Transform and respond
		const transformedOrder = transformOrder(newOrder)
		res.status(201).json(transformedOrder)
	} catch (error) {
		logger.error('Order creation failed: Unexpected error', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getPaymentStatus (req: Request, res: Response, next: NextFunction): Promise<void> {
	const orderId = req.params.id
	logger.debug(`Getting payment status for order: ID ${orderId}`)

	if (!mongoose.Types.ObjectId.isValid(orderId)) {
		logger.warn(`Get payment status failed: Invalid Order ID format: ${orderId}`)
		res.status(400).json({ error: 'Invalid Order ID format' })
		return
	}

	try {
		const order = await OrderModel.findById(orderId)
			.lean() // Use lean as we only need the status

		if (order === null) {
			logger.warn(`Get payment status failed: Order not found. ID: ${orderId}`)
			res.status(404).json({ error: 'Ordre ikke fundet' })
			return
		}

		if (order.payment == null) {
			// This indicates a data inconsistency, though less likely with embedded doc
			logger.error(`Get payment status failed: Order ID ${orderId} has no embedded payment object.`)
			res.status(500).json({ error: 'Fejl ved hentning af betalingsstatus' })
			return
		}

		logger.debug(`Retrieved payment status for Order ID ${orderId}: ${order.payment.paymentStatus}`)
		res.status(200).json({ paymentStatus: order.payment.paymentStatus })
	} catch (error) {
		logger.error(`Get payment status failed for Order ID ${orderId}`, { error })
		// Avoid sending Mongoose validation/cast errors here, should be caught earlier
		next(error)
	}
}

export async function getOrdersWithQuery (req: GetOrdersWithDateRangeRequest, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting orders with query:', { query: JSON.stringify(req.query) })

	const {
		fromDate,
		toDate,
		status,
		paymentStatus
	} = req.query

	// Build the Mongoose query object dynamically
	const query: mongoose.FilterQuery<IOrder> = {} // Base query object
	const dateQuery: { $gte?: Date, $lte?: Date } = {} // Separate date query

	if (fromDate != null) {
		const from = new Date(fromDate)
		if (!isNaN(from.getTime())) {
			dateQuery.$gte = from
			logger.silly(`Query: Orders from ${from.toISOString()}`)
		} else {
			logger.warn(`Invalid fromDate query parameter: ${fromDate}`)
		}
	}
	if (toDate != null) {
		const to = new Date(toDate)
		if (!isNaN(to.getTime())) {
			dateQuery.$lte = to
			logger.silly(`Query: Orders up to ${to.toISOString()}`)
		} else {
			logger.warn(`Invalid toDate query parameter: ${toDate}`)
		}
	}
	if (Object.keys(dateQuery).length > 0) {
		query.createdAt = dateQuery
	}

	if (status != null) {
		const statuses = status.split(',').map(s => s.trim()).filter(s => s) // Trim and filter empty strings
		if (statuses.length > 0) {
			query.status = { $in: statuses }
			logger.silly(`Query: Order status in [${statuses.join(', ')}]`)
		}
	}

	// Payment status requires a more complex query involving the populated field
	const paymentStatusFilter = paymentStatus?.split(',').map(s => s.trim()).filter(s => s)

	try {
		logger.debug('Executing order query:', { query: JSON.stringify(query) })
		// Fetch orders
		const orders = await OrderModel.find(query)
			.sort({ createdAt: -1 }) // Sort by creation date descending
			.lean()
			.exec()

		logger.debug(`Initial query returned ${orders?.length ?? 0} orders`)

		// Filter by paymentStatus directly on the embedded payment object
		const filteredOrders = orders?.filter(order => {
			if (order.payment == null) { // Should not happen if schema enforces payment
				logger.warn(`Order ID ${order._id} skipped during payment status filtering: payment object is missing.`)
				return false
			}
			// Apply filter if paymentStatusFilter is provided
			return !paymentStatusFilter || paymentStatusFilter.includes(order.payment.paymentStatus)
		}) ?? []

		logger.debug(`${filteredOrders.length} orders remaining after payment status filter`)

		logger.info(`Successfully retrieved ${filteredOrders.length} orders matching query.`)
		res.status(200).json(filteredOrders.map(order => ({
			...transformOrder(order),
			clientTransactionId: order.payment?.clientTransactionId ?? null
		})))
	} catch (error) {
		logger.error('Failed to get orders with query', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function updateOrderStatus (req: Request, res: Response, next: NextFunction): Promise<void> {
	const {
		orderIds,
		status
	} = req.body

	logger.info(`Attempting to update status to "${status ?? 'N/A'}" for order IDs: [${Array.isArray(orderIds) ? orderIds.join(', ') : 'Invalid Input'}]`)

	// --- Input Validation ---
	if (!Array.isArray(orderIds) || orderIds.length === 0 || !orderIds.every(id => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id))) {
		logger.warn('Update order status failed: Invalid or empty orderIds array.')
		res.status(400).json({ error: 'orderIds must be a non-empty array of valid Order IDs' })
		return
	}
	const validStatuses = ['pending', 'confirmed', 'delivered']
	if (typeof status !== 'string' || !validStatuses.includes(status)) {
		logger.warn(`Update order status failed: Invalid status provided: "${status ?? 'N/A'}"`)
		res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
		return
	}
	// --- End Input Validation ---

	const session = await mongoose.startSession()
	session.startTransaction()
	let updatedCount = 0

	try {
		// Fetch orders within the transaction session
		const ordersToUpdate = await OrderModel.find({ _id: { $in: orderIds } })
			.session(session)
			.exec()

		if (ordersToUpdate.length === 0) {
			logger.warn(`Update order status: No orders found matching provided IDs: [${orderIds.join(', ')}]`)
			res.status(404).json({ error: 'Ingen ordre fundet med de angivne ID\'er' }) // More specific message
			await session.abortTransaction() // Abort before returning
			await session.endSession()
			return
		}

		logger.debug(`Found ${ordersToUpdate.length} orders to update status to "${status}"`)

		const updatedOrderDocs: IOrder[] = [] // Collect updated docs for response

		for (const order of ordersToUpdate) {
			if (order.status !== status) {
				logger.silly(`Updating status for Order ID ${order.id} from "${order.status ?? 'N/A'}" to "${status}"`)
				order.status = status as 'pending' | 'confirmed' | 'delivered' // Update the status
				await order.validate() // Validate any changes (though only status changed here)
				await order.save({ session }) // Save each order individually
				updatedCount++
				updatedOrderDocs.push(order) // Collect the updated orders for response
			} else {
				logger.silly(`Order ID ${order.id} already has status "${status}". Skipping save.`)
				updatedOrderDocs.push(order) // Include unchanged orders in response as well
			}
		}

		await session.commitTransaction()
		logger.info(`Successfully updated status to "${status}" for ${updatedCount} out of ${ordersToUpdate.length} found orders. IDs: [${orderIds.join(', ')}]`)

		res.status(200).json(updatedOrderDocs.map(transformOrder)) // Respond with the (potentially modified) documents
	} catch (error) {
		await session.abortTransaction()
		logger.error(`Update order status failed during transaction for status "${status}", IDs: [${orderIds.join(', ')}]`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	} finally {
		await session.endSession()
	}
}

export async function cancelOrder (req: Request, res: Response, next: NextFunction): Promise<void> {
	const kiosk = req.user as IKiosk
	const orderId = req.params.id
	logger.info(`Attempting to cancel order. Order ID: ${orderId}, Kiosk ID: ${kiosk._id}`)
	if (kiosk == null) {
		logger.warn('Cancel order failed: Kiosk not found in request.')
		res.status(400).json({ error: 'Kiosk not found in request.' })
		return
	}
	if (kiosk.readerId == null) {
		logger.warn('Cancel order failed: Kiosk has no associated reader.')
		res.status(400).json({ error: 'Kiosk has no associated reader.' })
		return
	}
	if (!mongoose.Types.ObjectId.isValid(orderId)) {
		logger.warn(`Cancel order failed: Invalid Order ID format: ${orderId}`)
		res.status(400).json({ error: 'Invalid Order ID format' })
		return
	}

	try {
		// Populate readerId to get apiReferenceId
		const populatedKiosk = await kiosk.populate<{ readerId: IReader }>('readerId')
		if (populatedKiosk == null || populatedKiosk.readerId == null || populatedKiosk.readerId.apiReferenceId == null) {
			logger.warn('Cancel order failed: Could not populate readerId with apiReferenceId.')
			res.status(400).json({ error: 'Kiosk reader information could not be retrieved.' })
			return
		}

		const order = await OrderModel.findById(orderId)
		if (order == null) {
			logger.warn(`Cancel order failed: Order not found. ID: ${orderId}`)
			res.status(404).json({ error: 'Ordre ikke fundet' })
			return
		}
		if (order.payment == null) {
			logger.warn(`Cancel order failed: Order ID ${orderId} has no associated payment details.`)
			res.status(500).json({ error: 'Fejl ved annullering af ordre: Betalingsdetaljer mangler.' })
			return
		}
		if (order.checkoutMethod !== 'sumUp') {
			logger.warn(`Cancel order failed: Order ID ${orderId} is not a SumUp checkout. Checkout method: ${order.checkoutMethod}`)
			res.status(400).json({ error: 'Ordren kan kun annulleres, hvis den er en SumUp checkout' })
			return
		}
		if (order.kioskId == null) {
			logger.warn(`Cancel order failed: Order ID ${orderId} has no associated kioskId.`)
			res.status(500).json({ error: 'Fejl ved annullering af ordre: Kiosk ID mangler.' })
			return
		}
		if (order.kioskId.toString() != populatedKiosk.id) {
			logger.warn(`Cancel order failed: Order ID ${orderId} does not belong to the current kiosk. Kiosk ID: ${populatedKiosk.id}`)
			res.status(403).json({ error: 'Ordren tilhører ikke denne kiosk' })
			return
		}
		if (order.payment.paymentStatus !== 'pending') {
			logger.warn(`Cancel order failed: Order ID ${orderId} is not in a cancellable state. Current payment status: ${order.payment.paymentStatus}`)
			res.status(400).json({ error: 'Ordren kan ikke annulleres i sin nuværende tilstand' })
			return
		}
		if (order.checkoutMethod !== 'sumUp') {
			logger.warn(`Cancel order failed: Order ID ${orderId} is not a SumUp checkout. Checkout method: ${order.checkoutMethod}`)
			res.status(400).json({ error: 'Ordren kan kun annulleres, hvis den er en SumUp checkout' })
			return
		}
		await cancelReaderCheckout(populatedKiosk.readerId.apiReferenceId)
		res.status(200).json({ message: 'Checkout cancelled successfully' })
	} catch (error) {
		logger.error(`Error during order cancellation for Order ID ${orderId}`, { error })
		next(error)
	}
}
