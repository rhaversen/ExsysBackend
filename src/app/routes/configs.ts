// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'
import { isAdmin, isAdminOrKiosk } from '../middleware/authorization.js'

// Controller functions
import {
	getConfigs,
	patchConfigs
} from '../controllers/configsController.js'
// Environment variables

// Config variables

// Destructuring and global variables
const router = Router()

/**
 * @route GET /api/v1/configs
 * @description Get configs.
 * @access Private
 * @middleware isAdminOrKiosk
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The configs.
 */
router.get('/',
	isAdminOrKiosk,
	asyncErrorHandler(getConfigs)
)

/**
 * @route PATCH /api/v1/configs
 * @description Update a config.
 * @access Private
 * @middleware isAdmin
 * @param {string} [req.body.kioskInactivityTimeoutMs] - The inactivity timeout of the kiosk (optional).
 * @param {string} [req.body.kioskInactivityTimeoutWarningMs] - The inactivity timeout warning of the kiosk (optional).
 * @param {string} [req.body.kioskOrderConfirmationTimeoutMs] - The order confirmation timeout of the kiosk (optional).
 * @param {number[]} [req.body.disabledWeekdays] - The disabled weekdays of the kiosk, 0=Monday, 6=Sunday (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated configs.
 */
router.patch('/',
	isAdmin,
	asyncErrorHandler(patchConfigs)
)

export default router
