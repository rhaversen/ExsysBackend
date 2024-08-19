// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { createOrder, getOrdersWithQuery, updateOrderStatus } from '../controllers/orderController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/orders
 * @desc Create a new order
 * @access Public
 * @param {Types.ObjectId} req.body.activityId - Reference to the activity the order is for
 * @param {Array<{product: Types.ObjectId, quantity: number}>} req.body.products - The products and their quantities
 * @param {Array<{option: Types.ObjectId, quantity: number}>} [req.body.options] - Additional options for the order (optional)
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created order.
 */
router.post('/',
	asyncErrorHandler(createOrder)
)

/**
 * @route GET api/v1/orders/?fromDate&toDate
 * @desc Get orders with date range query
 * @access Public
 * @param {string} [req.query.fromDate] - The start date of the range (optional).
 * @param {string} [req.query.toDate] - The end date of the range (optional).
 * @param {string} [req.query.status] - The status of the orders (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The orders matching the date.
 */
router.get('/',
	asyncErrorHandler(getOrdersWithQuery)
)

/**
 * @route PATCH api/v1/orders
 * @desc Update status of an order
 * @access Public
 * @param {Array<Types.ObjectId>} req.body.orderIds - The IDs of the orders to update.
 * @param {string} req.body.status - The new status of the orders.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The updated orders.
 */
router.patch('/',
	asyncErrorHandler(updateOrderStatus)
)

export default router
