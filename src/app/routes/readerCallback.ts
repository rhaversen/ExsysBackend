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
 * @route POST api/v1/reader-callback
 * @desc Callback used by SumUp to update the payment status of an order
 * @access Public
 * @param {string} req.body.payload.client_transaction_id - The ID of the transaction.
 * @param {string} req.body.payload.status - The status of the transaction.
 */
router.post('/',
	asyncErrorHandler(updatePaymentStatus)
)

export default router
