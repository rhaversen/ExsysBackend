// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { createOption, deleteOption, getOptions, patchOption } from '../controllers/optionController.js'

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

/**
 * @route GET api/v1/options
 * @desc Get all options
 * @access Public
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The options.
 */
router.get('/',
	asyncErrorHandler(getOptions)
)

/**
 * @route PATCH api/v1/options/:id
 * @desc Update an option
 * @access Public
 * @param {string} req.params.id - The id of the option to be patched.
 * @param {string} [req.body.name] - The name of the option (optional).
 * @param {number} [req.body.maxOrderQuantity] - The maximum quantity of the option that can be ordered (optional).
 * @param {string} [req.body.description] - The description of the option (optional).
 * @param {number} [req.body.availability] - The number of the option that is available (optional).
 * @param {number} [req.body.price] - The price of the option (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated option.
 */
router.patch('/:id',
	asyncErrorHandler(patchOption)
)

/**
 * @route DELETE api/v1/options/:id
 * @desc Delete an option
 * @access Public
 * @param {string} req.params.id - The id of the option to be deleted.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	asyncErrorHandler(deleteOption)
)

export default router
