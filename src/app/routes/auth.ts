import { Router } from 'express'

import {
	ensureAuthenticated,
	loginAdminLocal,
	loginKioskLocal,
	logoutLocal
} from '../controllers/authController.js'
import { isAdmin, isKiosk } from '../middleware/authorization.js'
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

const router = Router()

/**
 * @route POST /api/v1/auth/login-kiosk-local
 * @description Login kiosk and return session cookie.
 * @access Public
 * @param {string} req.body.kioskTag - The tag of the kiosk.
 * @param {string} req.body.password - The password of the kiosk.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The kiosk object.
 * @returns {string} res.headers['set-cookie'] - The session cookie.
 */
router.post('/login-kiosk-local',
	asyncErrorHandler(loginKioskLocal)
)

/**
 * @route POST /api/v1/auth/login-admin-local
 * @description Login admin and return session cookie.
 * @access Public
 * @param {string} req.body.name - The name of the admin.
 * @param {string} req.body.password - The password of the admin.
 * @param {string} [req.body.stayLoggedIn] - Whether to stay logged in or not (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The admin object.
 * @returns {string} res.headers['set-cookie'] - The session cookie.
 */
router.post('/login-admin-local',
	asyncErrorHandler(loginAdminLocal)
)

/**
 * @route POST /api/v1/auth/logout-local
 * @description Logout user and clear session cookie.
 * @access Private
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.post('/logout-local',
	asyncErrorHandler(logoutLocal)
)

/**
 * @route GET /api/v1/auth/is-authenticated
 * @description Check if user is authenticated.
 * @access Private
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/is-authenticated',
	ensureAuthenticated,
	(req, res) => {
		// If user is authenticated, return 200 OK and session ID
		res.status(200).send(req.sessionID)
	}
)

/**
 * @route GET /api/v1/auth/is-admin
 * @description Check if user is an admin.
 * @access Private
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/is-admin',
	isAdmin,
	(req, res) => {
		res.status(200).send()
	}
)

/**
 * @route GET /api/v1/auth/is-kiosk
 * @description Check if user is a kiosk.
 * @access Private
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The kiosk object.
 */
router.get('/is-kiosk',
	isKiosk,
	(req, res) => {
		res.status(200).send()
	}
)

export default router
