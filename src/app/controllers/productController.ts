// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import ProductModel from '../models/Product.js'
import logger from '../utils/logger.js'

export async function createProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating product')

	try {
		const newProduct = await ProductModel.create(req.body as Record<string, unknown>)
		res.status(201).json(newProduct)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
