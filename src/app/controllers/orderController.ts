// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import OrderModel from '../models/Order.js'
import logger from '../utils/logger.js'

interface OrderItem {
	id: string
	quantity: number
}

interface CreateOrderRequest extends Request {
	body: {
		activityId?: string
		products?: OrderItem[]
		options?: OrderItem[]
	}
}

function combineItemsById (items: OrderItem[]): OrderItem[] {
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

async function countSubtotalOfOrder (products: OrderItem[], options: OrderItem[] = []): Promise<number> {
	let sum = 0
	for (const item of products) {
		const itemDoc = await ProductModel.findById(item.id)
		if (itemDoc !== null) {
			sum += itemDoc.price * item.quantity
		}
	}
	for (const item of options) {
		const itemDoc = await OptionModel.findById(item.id)
		if (itemDoc !== null) {
			sum += itemDoc.price * item.quantity
		}
	}
	return sum
}

function isOrderItemList (items: any[]): items is OrderItem[] {
	return Array.isArray(items) && items.every((item: OrderItem) => {
		return item !== null && typeof item === 'object' && typeof item.id === 'string' && typeof item.quantity === 'number'
	})
}

export async function createOrder (req: CreateOrderRequest, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating order')

	// Filter out products with quantity 0 or undefined
	req.body.products = req.body.products?.filter((product) => product.quantity !== 0 && product.quantity !== undefined)

	// Filter out options with quantity 0 or undefined
	req.body.options = req.body.options?.filter((option) => option.quantity !== 0 && option.quantity !== undefined)

	// Combine products and options with same id and add together their quantities
	req.body.products = combineItemsById(req.body.products)
	req.body.options = combineItemsById(req.body.options)

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		activityId: req.body.activityId,
		products: req.body.products,
		options: req.body.options
	}

	try {
		const newOrder = await OrderModel.create(allowedFields)
		res.status(201).json(newOrder)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
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
		const orders = await OrderModel.find({
			...query,
			'paymentId.paymentStatus': paymentStatus
		})
			.populate('paymentId', 'paymentStatus') // Populate the paymentId with only the paymentStatus
			.select('-paymentId') // Exclude the paymentId from the results
			.exec()

		res.status(200).json(orders)
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
