// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { createOrder } from '../controllers/orderController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/orders
 * @desc Create a new order
 * @access Public
 * @param {Date} req.body.requestedDeliveryDate - The date the order is supposed to be delivered
 * @param {Types.ObjectId} req.body.roomId - Reference to the Room document
 * @param {Array<{product: Types.ObjectId, quantity: number}>} req.body.products - The products and their quantities
 * @param {Array<{option: Types.ObjectId, quantity: number}>} [req.body.options] - Additional options for the order (optional)
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created order.
 */
router.post('/',
    asyncErrorHandler(createOrder)
)

export default router
