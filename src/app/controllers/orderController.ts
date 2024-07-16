// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import OrderModel from '../models/Order.js'
import logger from '../utils/logger.js'

interface OrderItem {
	id?: string
	quantity?: number
}

interface CreateOrderRequest extends Request {
	body: {
		roomId?: string
		products?: OrderItem[]
		options?: OrderItem[]
	}
}

interface GetOrdersWithDateRangeRequest extends Request {
	query: {
		fromDate?: string
		toDate?: string
		status?: string
	}
}

function combineItemsById (items: OrderItem[] | undefined): OrderItem[] | undefined {
	return items?.reduce((accumulator: OrderItem[], currentItem: OrderItem) => {
		// Find if the item already exists in the accumulator
		const existingItem = accumulator.find((item: OrderItem) => item.id === currentItem.id)
		if (existingItem !== null && existingItem !== undefined) {
			// If the item exists, add the quantities
			existingItem.quantity = (existingItem.quantity ?? 0) + (currentItem.quantity ?? 0)
		} else {
			// If the item doesn't exist, add it to the accumulator
			accumulator.push(currentItem)
		}
		return accumulator
	}, [])
}

export async function createOrder (req: CreateOrderRequest, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating order')

	try {
		// Filter out products with quantity 0 or undefined
		req.body.products = req.body.products?.filter((product) => product.quantity !== 0 && product.quantity !== undefined)

		// Filter out options with quantity 0 or undefined
		req.body.options = req.body.options?.filter((option) => option.quantity !== 0 && option.quantity !== undefined)

		// Combine products and options with same id and add together their quantities
		req.body.products = combineItemsById(req.body.products)
		req.body.options = combineItemsById(req.body.options)

		// Create a new object with only the allowed fields
		const allowedFields: Record<string, unknown> = {
			roomId: req.body.roomId,
			products: req.body.products,
			options: req.body.options
		}

		const newOrder = await OrderModel.create(allowedFields)
		res.status(201).json(newOrder)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getOrdersWithQuery (req: GetOrdersWithDateRangeRequest, res: Response, next: NextFunction): Promise<void> {
	const {
		fromDate,
		toDate,
		status
	} = req.query
	const query: {
		createdAt?: {
			$gte?: string
			$lte?: string
		}
		status?: {
			$in?: string[]

		}
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
		const orders = await OrderModel.find(query)
		res.status(200).json(orders)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			logger.error(error)
			next(error)
		}
	}
}

export async function updateOrderStatus (req: Request, res: Response, next: NextFunction): Promise<void> {
	const {
		orderIds,
		status
	} = req.body

	if (orderIds === undefined || status === undefined) {
		res.status(400).json({ error: 'Mangler orderIds eller status' })
		return
	}

	if (!Array.isArray(orderIds) || orderIds.length === 0) {
		res.status(400).json({ error: 'orderIds skal være en ikke-tom array' })
		return
	}

	try {
		await OrderModel.updateMany(
			{ _id: { $in: orderIds } },
			{ $set: { status } },
			{
				new: true,
				runValidators: true
			}
		)
		const updatedOrders = await OrderModel.find({ _id: { $in: orderIds } })

		res.status(200).json(updatedOrders)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			logger.error(error)
			next(error)
		}
	}
}
