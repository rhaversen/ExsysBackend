import { Router } from 'express'

import { updatePaymentStatus } from '../controllers/readerCallbackController.js'
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

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
