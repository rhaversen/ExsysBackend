// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'
import { isAdmin, isAdminOrKiosk } from '../middleware/authorization.js'

// Controller functions
import { createProduct, deleteProduct, getProducts, patchProduct } from '../controllers/productController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/products
 * @desc Create a new product
 * @access Private
 * @param {string} req.body.name - The name of the product.
 * @param {number} req.body.price - The price of the product.
 * @param {string} req.body.imageURL - The image URL of the product.
 * @param {Array<{from: {hour: number, minute: number}, to: {hour: number, minute: number}}>} req.body.orderWindow - The order window of the product.
 * @param {Array<Types.ObjectId>} [req.body.options] - The options that can be added to the product (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created product.
 */
router.post('/',
	isAdmin,
	asyncErrorHandler(createProduct)
)

/**
 * @route GET api/v1/products
 * @desc Get all products
 * @access Private
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The products.
 */
router.get('/',
	isAdminOrKiosk,
	asyncErrorHandler(getProducts)
)

/**
 * @route PATCH api/v1/products/:id
 * @desc Update a product
 * @access Private
 * @param {string} req.params.id - The id of the product to be patched.
 * @param {string} [req.body.name] - The name of the product (optional).
 * @param {number} [req.body.price] - The price of the product (optional).
 * @param {string} [req.body.imageURL] - The image URL of the product (optional).
 * @param {Array<{from: {hour: number, minute: number}, to: {hour: number, minute: number}}>} [req.body.orderWindow] - The order window of the product (optional).
 * @param {Array<Types.ObjectId>} [req.body.options] - The options that can be added to the product (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated product.
 */
router.patch('/:id',
	isAdmin,
	asyncErrorHandler(patchProduct)
)

/**
 * @route DELETE api/v1/products/:id
 * @desc Delete a product
 * @access Private
 * @param {string} req.params.id - The id of the product to be deleted.
 * @param {boolean} req.body.confirm - Confirm the deletion.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	asyncErrorHandler(deleteProduct)
)

export default router
