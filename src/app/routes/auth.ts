// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { ensureAuthenticated, loginAdminLocal, loginKioskLocal, logoutLocal } from '../controllers/authController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/auth/login-kiosk-local
 * @desc Login kiosk and return session cookie
 * @access Public
 * @param {string} req.body.kioskTag The tag of the kiosk.
 * @param {string} req.body.password The password of the kiosk.
 * @return {number} res.status The status code of the HTTP response.
 * @return {object} res.body The kiosk object.
 * @return {string} res.headers['set-cookie'] The session cookie.
 */
router.post('/login-kiosk-local',
	asyncErrorHandler(loginKioskLocal)
)

/**
 * @route POST api/v1/auth/login-admin-local
 * @desc Login admin and return session cookie
 * @access Public
 * @param {string} req.body.email The email of the admin.
 * @param {string} req.body.password The password of the admin.
 * @param {string} [req.body.stayLoggedIn] Whether to stay logged in or not.
 * @return {number} res.status The status code of the HTTP response.
 * @return {object} res.body The admin object.
 * @return {string} res.headers['set-cookie'] The session cookie.
 */
router.post('/login-admin-local',
	asyncErrorHandler(loginAdminLocal)
)

/**
 * @route POST api/v1/auth/logout-local
 * @desc Logout user and clear session cookie
 * @access Private
 * @return {number} res.status The status code of the HTTP response.
 */
router.post('/logout-local',
	asyncErrorHandler(logoutLocal)
)

/**
 * @route GET api/v1/auth/is-authenticated
 * @desc Check if user is authenticated
 * @access Private
 * @return {number} res.status The status code of the HTTP response.
 */
router.get('/is-authenticated',
	ensureAuthenticated,
	(req, res) => {
		res.status(200).send()
	}
)

export default router
