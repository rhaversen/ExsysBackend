// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import ProductModel from '../models/Product.js'
import logger from '../utils/logger.js'
import { emitProductCreated, emitProductDeleted, emitProductUpdated } from '../webSockets/productHandlers.js'

// Environment variables

// Config variables

// Destructuring and global variables

export async function createProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating product')

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		name: req.body.name,
		price: req.body.price,
		imageURL: req.body.imageURL,
		orderWindow: req.body.orderWindow,
		options: req.body.options,
		isActive: req.body.isActive
	}

	try {
		const newProduct = await (await ProductModel.create(allowedFields)).populate('options')
		res.status(201).json(newProduct)
		emitProductCreated(newProduct)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
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
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching product')

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		// Retrieve the existing product document
		const product = await ProductModel.findById(req.params.id).session(session)

		if (product === null || product === undefined) {
			res.status(404).json({ error: 'Produkt ikke fundet' })
			return
		}

		// Manually set each field from allowed fields if it's present in the request body
		if (req.body.name !== undefined) product.name = req.body.name
		if (req.body.price !== undefined) product.price = req.body.price
		if (req.body.imageURL !== undefined) product.imageURL = req.body.imageURL
		if (req.body.orderWindow !== undefined) product.orderWindow = req.body.orderWindow
		if (req.body.options !== undefined) product.options = req.body.options
		if (req.body.isActive !== undefined) product.isActive = req.body.isActive

		// Validate and save the updated document
		await product.validate()
		await product.save({ session })

		await product.populate('options')

		await session.commitTransaction()

		res.json(product)

		emitProductUpdated(product)
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

		emitProductDeleted(product.id as string)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
