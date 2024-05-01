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
		products?: OrderItem[]
		options?: OrderItem[]
	}
}

function combineItems (items: OrderItem[] | undefined): OrderItem[] | undefined {
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
		req.body.products = combineItems(req.body.products)
		req.body.options = combineItems(req.body.options)

		const newOrder = await OrderModel.create(req.body as Record<string, unknown>)
		res.status(201).json(newOrder)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getOrdersForToday (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting today\'s orders')
	// Always use UTC time

	const start = new Date()
	start.setUTCHours(0, 0, 0, 0)
	const end = new Date()
	end.setUTCHours(23, 59, 59, 999)

	try {
		const orders = await OrderModel.find({
			createdAt: {
				$gte: start,
				$lte: end
			}
		})
		res.status(200).json(orders)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getOrders (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting orders')
	try {
		const orders = await OrderModel.find()
		res.status(200).json(orders)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
