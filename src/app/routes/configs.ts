import { Router } from 'express'

import {
	getConfigs,
	patchConfigs
} from '../controllers/configsController.js'
import { isAdmin, isAdminOrKiosk } from '../middleware/authorization.js'

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
	getConfigs
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
 * @param {string} [req.body.kioskPassword] - The unified password for all kiosks (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated configs.
 */
router.patch('/',
	isAdmin,
	patchConfigs
)

export default router
