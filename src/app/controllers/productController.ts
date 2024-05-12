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
		const newProduct = await (await ProductModel.create(req.body as Record<string, unknown>)).populate('options')
		res.status(201).json(newProduct)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getProducts (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting products')

	try {
		const products = await ProductModel.find({}).populate('options')
		res.status(200).json(products)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching product')

	try {
		const product = await ProductModel.findByIdAndUpdate(req.params.id, req.body as Record<string, unknown>, {
			new: true,
			runValidators: true
		}).populate('options')

		if (product === null || product === undefined) {
			res.status(404).json({ error: 'Produkt ikke fundet' })
			return
		}

		res.json(product)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function deleteProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Deleting product')

	if (req.body.confirm === undefined || req.body.confirm === null || typeof req.body.confirm !== 'boolean' || req.body.confirm !== true) {
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const product = await ProductModel.findByIdAndDelete(req.params.id)

		if (product === null || product === undefined) {
			res.status(404).json({ error: 'Produkt ikke fundet' })
			return
		}

		res.status(204).send()
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
