// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'
import { isAdmin, isAdminOrKiosk } from '../middleware/authorization.js'

// Controller functions
import { createOption, deleteOption, getOptions, patchOption } from '../controllers/optionController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/options
 * @desc Create a new option
 * @access Private
 * @param {string} req.body.name - The name of the option.
 * @param {string} req.body.imageURL - The image URL of the option.
 * @param {number} req.body.price - The price of the option.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created option.
 */
router.post('/',
	isAdmin,
	asyncErrorHandler(createOption)
)

/**
 * @route GET api/v1/options
 * @desc Get all options
 * @access Private
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The options.
 */
router.get('/',
	isAdminOrKiosk,
	asyncErrorHandler(getOptions)
)

/**
 * @route PATCH api/v1/options/:id
 * @desc Update an option
 * @access Private
 * @param {string} req.params.id - The id of the option to be patched.
 * @param {string} [req.body.name] - The name of the option (optional).
 * @param {string} [req.body.imageURL] - The image URL of the option (optional).
 * @param {number} [req.body.price] - The price of the option (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated option.
 */
router.patch('/:id',
	isAdmin,
	asyncErrorHandler(patchOption)
)

/**
 * @route DELETE api/v1/options/:id
 * @desc Delete an option
 * @access Private
 * @param {string} req.params.id - The id of the option to be deleted.
 * @param {boolean} req.body.confirm - Confirm the deletion.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	asyncErrorHandler(deleteOption)
)

export default router
