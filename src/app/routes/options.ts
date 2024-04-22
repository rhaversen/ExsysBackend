// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { createOption } from '../controllers/optionController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/options
 * @desc Create a new option
 * @access Public
 * @param {string} req.body.name - The name of the option.
 * @param {number} req.body.maxOrderQuantity - The maximum quantity of the option that can be ordered.
 * @param {string} req.body.description - The description of the option.
 * @param {number} req.body.availability - The number of the option that is available.
 * @param {number} req.body.price - The price of the option.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created option.
 */
router.post('/',
	asyncErrorHandler(createOption)
)

export default router
