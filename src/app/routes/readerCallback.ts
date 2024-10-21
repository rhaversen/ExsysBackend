// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { updatePaymentStatus } from '../controllers/readerCallbackController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST /api/v1/reader-callback
 * @description Callback used by SumUp to update the payment status of an order.
 * @access Public
 * @param {string} req.body.payload.client_transaction_id - The ID of the transaction.
 * @param {string} req.body.payload.status - The status of the transaction.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated payment status.
 */
router.post('/',
	asyncErrorHandler(updatePaymentStatus)
)

export default router
