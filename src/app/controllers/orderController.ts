// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import OrderModel, { type IOrderPopulatedPaymentId } from '../models/Order.js'
import logger from '../utils/logger.js'
import KioskModel from '../models/Kiosk.js'
import { createReaderCheckout } from '../services/apiServices.js'
import ReaderModel from '../models/Reader.js'
import PaymentModel from '../models/Payment.js'
import ProductModel from '../models/Product.js'
import OptionModel from '../models/Option.js'

interface OrderItem {
	id: string
	quantity: number
}

export function combineItemsById (items: OrderItem[]): OrderItem[] {
	return items.reduce((accumulator: OrderItem[], currentItem: OrderItem) => {
		const existingItem = accumulator.find(item => item.id === currentItem.id)
		if (existingItem != null) {
			existingItem.quantity += currentItem.quantity
		} else {
			accumulator.push({ ...currentItem })
		}
		return accumulator
	}, [])
}

export function removeItemsWithZeroQuantity (items: OrderItem[]): OrderItem[] {
	return items.filter(item => item.quantity > 0)
}

export async function countSubtotalOfOrder (products: OrderItem[], options: OrderItem[] = []): Promise<number> {
	let sum = 0
	for (const item of products) {
		const itemDoc = await ProductModel.findById(item.id)
		if (itemDoc !== null) {
			sum += itemDoc.price * Math.max(0, Math.floor(item.quantity))
		}
	}
	for (const item of options) {
		const itemDoc = await OptionModel.findById(item.id)
		if (itemDoc !== null) {
			sum += itemDoc.price * Math.max(0, Math.floor(item.quantity))
		}
	}
	return sum
}

export function isOrderItemList (items: any[]): items is OrderItem[] {
	return Array.isArray(items) && items.every((item: OrderItem) => {
		return item !== null && typeof item === 'object' && typeof item.id === 'string' && typeof item.quantity === 'number' && item.quantity >= 0 && Number.isInteger(item.quantity)
	})
}

async function createCheckout (kioskId: string, subtotal: number): Promise<string | undefined> {
	// Find the reader associated with the kiosk
	const kiosk = await KioskModel.findById(kioskId)
	const reader = await ReaderModel.findById(kiosk?.readerId)

	if (reader === null || reader === undefined) {
		logger.error('Reader not found')
		return
	}

	// Create a checkout for the reader
	const clientTransactionId = await createReaderCheckout(reader.apiReferenceId, subtotal)

	if (clientTransactionId === undefined) {
		logger.error('Could not create checkout')
		return
	}

	// Create a new payment and order
	const newPayment = await PaymentModel.create({
		clientTransactionId,
		status: 'pending'
	})
	return newPayment.id
}

export async function createOrder (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating order')

	const {
		activityId,
		kioskId,
		products,
		options,
		skipCheckout
	} = req.body as Record<string, unknown>

	// Check if the products
	if (!Array.isArray(products) || !isOrderItemList(products)) {
		res.status(400).json({ error: 'Invalid produkt data' })
		return
	}

	// Check if the options are valid or undefined
	if (options !== undefined && (!(Array.isArray(options)) || !isOrderItemList(options))) {
		res.status(400).json({ error: 'Invalid tilvalg data' })
		return
	}

	// Check if the kioskId is a string
	if (typeof kioskId !== 'string') {
		res.status(400).json({ error: 'Mangler kioskId' })
		return
	}

	try {
		// Remove items with zero quantity
		const filteredProducts = removeItemsWithZeroQuantity(products)
		const filteredOptions = removeItemsWithZeroQuantity(options ?? [])

		// Combine the products and options by id
		const combinedProducts = combineItemsById(filteredProducts)
		const combinedOptions = combineItemsById(filteredOptions ?? [])

		// Count the subtotal of the order
		const subtotal = await countSubtotalOfOrder(combinedProducts, combinedOptions)

		let paymentId: string | undefined
		if (skipCheckout !== true) {
			paymentId = await createCheckout(kioskId, subtotal)
			if (paymentId === undefined) {
				res.status(500).json({ error: 'Kunne ikke oprette checkout' })
				return
			}
		} else {
			const newPayment = await PaymentModel.create({
				paymentStatus: 'successful'
			})
			paymentId = newPayment.id
		}

		// Create the order
		const newOrder = await OrderModel.create({
			activityId,
			products: combinedProducts,
			options: combinedOptions,
			paymentId
		})

		// Respond with the new order
		res.status(201).json(newOrder)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getPaymentStatus (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting payment status')

	const orderId = req.params.id

	try {
		const order = await OrderModel.findById(orderId).populate('paymentId') as IOrderPopulatedPaymentId | null
		if (order === null) {
			res.status(404).json({ error: 'Ordre ikke fundet' })
			return
		}

		res.status(200).json({ paymentStatus: order.paymentId.paymentStatus })
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			logger.error(error)
			next(error)
		}
	}
}

interface GetOrdersWithDateRangeRequest extends Request {
	query: {
		fromDate?: string
		toDate?: string
		status?: string
		paymentStatus?: string
	}
}

export async function getOrdersWithQuery (req: GetOrdersWithDateRangeRequest, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting orders with query')

	const {
		fromDate,
		toDate,
		status,
		paymentStatus
	} = req.query
	const query: {
		createdAt?: {
			$gte?: string
			$lte?: string
		}
		status?: {
			$in?: string[]
		}
		paymentStatus?: ['pending' | 'successful' | 'failed']
	} = {}

	if (fromDate !== undefined && fromDate !== '') {
		query.createdAt = query.createdAt ?? {}
		query.createdAt.$gte = fromDate
	}
	if (toDate !== undefined && toDate !== '') {
		query.createdAt = query.createdAt ?? {}
		query.createdAt.$lte = toDate
	}
	if (status !== undefined && status !== '') {
		query.status = { $in: status.split(',') }
	}

	try {
		// Fetch and populate orders
		const orders = await OrderModel.find({ ...query })
			.populate({ path: 'paymentId', select: 'paymentStatus' })
			.exec() as IOrderPopulatedPaymentId[] | null

		// Concisely filter orders based on paymentStatus
		const filteredOrders = orders?.filter(order =>
			paymentStatus === undefined ||
			(order.paymentId?.paymentStatus !== null && paymentStatus.split(',').includes(order.paymentId.paymentStatus))
		)

		// Remove the paymentId from the response
		filteredOrders?.forEach((order: any) => {
			order.paymentId = undefined
		})

		res.status(200).json(filteredOrders)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			logger.error(error)
			next(error)
		}
	}
}

export async function updateOrderStatus (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Updating order status')

	const { orderIds, status } = req.body

	if (orderIds === undefined || status === undefined) {
		res.status(400).json({ error: 'Mangler orderIds eller status' })
		return
	}

	if (!Array.isArray(orderIds) || orderIds.length === 0) {
		res.status(400).json({ error: 'orderIds skal være en ikke-tom array' })
		return
	}

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		const ordersToUpdate = await OrderModel.find({ _id: { $in: orderIds } }).session(session)

		if (ordersToUpdate.length === 0) {
			res.status(404).json({ error: 'Ingen ordre fundet' })
			return
		}

		const updatedOrders = []

		for (const order of ordersToUpdate) {
			order.status = status // Update the status
			await order.validate() // Validate any changes
			await order.save({ session }) // Save each order individually
			updatedOrders.push(order) // Collect the updated orders for response
		}

		await session.commitTransaction()

		res.status(200).json(updatedOrders)
	} catch (error) {
		await session.abortTransaction()
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	} finally {
		await session.endSession()
	}
}
