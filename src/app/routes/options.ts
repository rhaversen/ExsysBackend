import { Router } from 'express'

import {
	createOption,
	deleteOption,
	getOptions,
	patchOption
} from '../controllers/optionController.js'
import { isAdmin, isAdminOrKiosk } from '../middleware/authorization.js'

const router = Router()

/**
 * @route POST /api/v1/options
 * @description Create a new option.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.body.name - The name of the option.
 * @param {string} req.body.imageURL - The image URL of the option.
 * @param {number} req.body.price - The price of the option.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The newly created option.
 */
router.post('/',
	isAdmin,
	createOption
)

/**
 * @route GET /api/v1/options
 * @description Get all options.
 * @access Private
 * @middleware isAdminOrKiosk
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Array<Object>} res.body - The list of options.
 */
router.get('/',
	isAdminOrKiosk,
	getOptions
)

/**
 * @route PATCH /api/v1/options/:id
 * @description Update an option.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the option to be updated.
 * @param {string} [req.body.name] - The name of the option (optional).
 * @param {string} [req.body.imageURL] - The image URL of the option (optional).
 * @param {number} [req.body.price] - The price of the option (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated option.
 */
router.patch('/:id',
	isAdmin,
	patchOption
)

/**
 * @route DELETE /api/v1/options/:id
 * @description Delete an option by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the option to be deleted.
 * @param {boolean} req.body.confirm - Confirmation of the deletion.
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	deleteOption
)

export default router
