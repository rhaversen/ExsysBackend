import { Router } from 'express'

import {
	createOrder,
	getOrdersWithQuery,
	getPaymentStatus,
	updateOrderStatus,
	cancelOrder
} from '../controllers/orderController.js'
import { isAdmin, isAdminOrKiosk, canCreateOrder } from '../middleware/authorization.js' // Import canCreateOrder

const router = Router()

/**
 * @route POST /api/v1/orders
 * @description Create a new order. Admins can create 'manual' orders, Kiosks can create 'sumUp' or 'later' orders.
 * @access Private
 * @middleware canCreateOrder - Enforces role-based checkout method restrictions.
 * @param {Types.ObjectId} req.body.activityId - The ID of the activity the order is for.
 * @param {Types.ObjectId} [req.body.kioskId] - The ID of the kiosk the order is from (omit for manual entry, required otherwise).
 * @param {Types.ObjectId} req.body.roomId - The ID of the room the order is for.
 * @param {'mobilePay' | 'sumUp' | 'later' | 'manual'} req.body.checkoutMethod - The method used for checkout.
 * @param {Array<{id: Types.ObjectId, quantity: number}>} req.body.products - The products and their quantities.
 * @param {Array<{id: Types.ObjectId, quantity: number}>} [req.body.options] - Additional options for the order (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The newly created order.
 */
router.post('/',
	canCreateOrder,
	createOrder
)

/**
 * @route GET /api/v1/orders/:id/paymentStatus
 * @description Get the payment status of an order.
 * @access Private
 * @middleware isAdminOrKiosk
 * @param {Types.ObjectId} req.params.id - The ID of the order to get the payment status for.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The payment status of the order.
 */
router.get('/:id/paymentStatus',
	isAdminOrKiosk,
	getPaymentStatus
)

/**
 * @route GET /api/v1/orders
 * @description Get orders with a date range query.
 * @access Private
 * @middleware isAdmin
 * @param {string} [req.query.fromDate] - The start date of the range (optional).
 * @param {string} [req.query.toDate] - The end date of the range (optional).
 * @param {string} [req.query.status] - The status of the orders (optional).
 * @param {string} [req.query.paymentStatus] - The payment status of the orders (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Array<Object>} res.body - The orders matching the query.
 */
router.get('/',
	isAdmin,
	getOrdersWithQuery
)

/**
 * @route PATCH /api/v1/orders
 * @description Update the status of an order.
 * @access Private
 * @middleware isAdmin
 * @param {Array<Types.ObjectId>} req.body.orderIds - The IDs of the orders to update.
 * @param {string} req.body.status - The new status of the orders.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Array<Object>} res.body - The updated orders.
 */
router.patch('/',
	isAdmin,
	updateOrderStatus
)

/**
 * @route POST /api/v1/orders/:id/cancel
 * @description Cancel an order.
 * @access Private
 * @middleware isAdminOrKiosk
 * @param {Types.ObjectId} req.params.id - The ID of the order to cancel.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The cancelled order.
 */
router.post('/:id/cancel',
	isAdminOrKiosk,
	cancelOrder
)

export default router
