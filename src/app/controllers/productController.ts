import { type NextFunction, type Request, type Response } from 'express'
import mongoose, { type FlattenMaps } from 'mongoose'

import ProductModel, { IProduct, IProductFrontend } from '../models/Product.js'
import logger from '../utils/logger.js'

export function transformProduct (
	productDoc: IProduct | FlattenMaps<IProduct>
): IProductFrontend {
	return {
		_id: productDoc._id.toString(),
		name: productDoc.name,
		price: productDoc.price,
		imageURL: productDoc.imageURL,
		orderWindow: productDoc.orderWindow,
		options: productDoc.options?.map((option) => option.toString()) ?? [],
		isActive: productDoc.isActive,
		createdAt: productDoc.createdAt,
		updatedAt: productDoc.updatedAt
	}
}

export async function createProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
	const productName = req.body.name ?? 'N/A'
	logger.info(`Attempting to create product with name: ${productName}`)

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
		// Create the product using the allowed fields
		const newProduct = await ProductModel.create(allowedFields)
		logger.debug(`Product created successfully: ID ${newProduct.id}, Name: ${newProduct.name}`)
		res.status(201).json(transformProduct(newProduct))
	} catch (error) {
		logger.error(`Product creation failed for name: ${productName}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getProducts (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting all products')

	try {
		const products = await ProductModel.find({}).lean()
		logger.debug(`Retrieved ${products.length} products`)
		res.status(200).json(products.map(transformProduct))
	} catch (error) {
		logger.error('Failed to get products', { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
	const productId = req.params.id
	logger.info(`Attempting to patch product: ID ${productId}`)

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		// Retrieve the existing product document
		const product = await ProductModel.findById(productId).session(session)

		if (product === null || product === undefined) {
			logger.warn(`Patch product failed: Product not found. ID: ${productId}`)
			res.status(404).json({ error: 'Produkt ikke fundet' })
			await session.abortTransaction() // Abort transaction before returning
			await session.endSession()
			return
		}

		let updateApplied = false
		// Manually set each field from allowed fields if it's present in the request body and changed
		if (req.body.name !== undefined && product.name !== req.body.name) {
			logger.debug(`Updating name for product ID ${productId}`)
			product.name = req.body.name
			updateApplied = true
		}
		if (req.body.price !== undefined && product.price !== req.body.price) {
			logger.debug(`Updating price for product ID ${productId}`)
			product.price = req.body.price
			updateApplied = true
		}
		if (req.body.imageURL !== undefined && product.imageURL !== req.body.imageURL) {
			logger.debug(`Updating imageURL for product ID ${productId}`)
			product.imageURL = req.body.imageURL
			updateApplied = true
		}
		if (req.body.orderWindow !== undefined && JSON.stringify(product.orderWindow) !== JSON.stringify(req.body.orderWindow)) { // Basic object comparison
			logger.debug(`Updating orderWindow for product ID ${productId}`)
			product.orderWindow = req.body.orderWindow
			updateApplied = true
		}
		if (req.body.options !== undefined) { // Array comparison is complex, log if provided
			logger.debug(`Updating options for product ID ${productId}`)
			product.options = req.body.options
			updateApplied = true
		}
		if (req.body.isActive !== undefined && product.isActive !== req.body.isActive) {
			logger.debug(`Updating isActive status for product ID ${productId}`)
			product.isActive = req.body.isActive
			updateApplied = true
		}

		if (!updateApplied) {
			logger.info(`Patch product: No changes detected for product ID ${productId}`)
			res.status(200).json(transformProduct(product)) // Return current state if no changes
			await session.commitTransaction()
			await session.endSession()
			return
		}

		// Validate and save the updated document
		await product.validate()
		await product.save({ session })

		await session.commitTransaction()
		logger.info(`Product patched successfully: ID ${productId}`)
		res.json(transformProduct(product))
	} catch (error) {
		await session.abortTransaction()
		logger.error(`Patch product failed: Error updating product ID ${productId}`, { error })
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
	const productId = req.params.id
	logger.info(`Attempting to delete product: ID ${productId}`)

	if (req.body?.confirm !== true) {
		logger.warn(`Product deletion failed: Confirmation not provided for ID ${productId}`)
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const product = await ProductModel.findById(productId)
		await product?.deleteOne()

		if (product === null || product === undefined) {
			logger.warn(`Product deletion failed: Product not found. ID: ${productId}`)
			res.status(404).json({ error: 'Produkt ikke fundet' })
			return
		}

		logger.info(`Product deleted successfully: ID ${productId}, Name: ${product.name}`)
		res.status(204).send()
	} catch (error) {
		logger.error(`Product deletion failed: Error during deletion process for ID ${productId}`, { error })
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
