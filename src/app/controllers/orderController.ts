// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import OrderModel from '../models/Order.js'
import logger from '../utils/logger.js'

export async function createOrder (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating order')
	try {
		// Filter out products with quantity 0
		if (req.body.products !== undefined && req.body.products.length !== null) {
			req.body.products = req.body.products.filter((product: { productId: string, quantity: number }) => product.quantity !== 0)
		}

		// Filter out options with quantity 0
		if (req.body.options !== undefined && req.body.options.length !== null) {
			req.body.options = req.body.options.filter((option: { productId: string, quantity: number }) => option.quantity !== 0)
		}

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
			requestedDeliveryDate: {
				$gte: start,
				$lte: end
			}
		})
		res.status(200).json(orders)
	} catch (error) {
		next(error)
	}
}

export async function getOrders (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting orders')
	try {
		const orders = await OrderModel.find()
		res.status(200).json(orders)
	} catch (error) {
		next(error)
	}
}
