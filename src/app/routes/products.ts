// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { createProduct } from '../controllers/productController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/products
 * @desc Create a new product
 * @access Public
 * @param {string} req.body.name - The name of the product.
 * @param {number} req.body.price - The price of the product.
 * @param {string} req.body.description - The description of the product.
 * @param {number} req.body.availability - The number of the product that is available.
 * @param {Array<{from: {hour: number, minute: number}, to: {hour: number, minute: number}}>} req.body.orderWindow - The order window of the product.
 * @param {Array<Types.ObjectId>} [req.body.options] - The options that can be added to the product (optional).
 * @param {number} req.body.maxOrderQuantity - The maximum quantity of the product that can be ordered.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created product.
 */
router.post('/',
	asyncErrorHandler(createProduct)
)

export default router
