// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { createKiosk, deleteKiosk, getKiosk, getKiosks, createNewKioskTag, patchKiosk } from '../controllers/kioskController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/kiosks
 * @desc Create a new kiosk
 * @access Public
 * @param {string} req.body.name - The name of the kiosk.
 * @param {string} req.body.roomId - The id of the room the kiosk is in.
 * @param {string} req.body.password - The password of the kiosk.
 * @param {string} req.body.confirmPassword - The password confirmation of the kiosk.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created kiosk.
 */
router.post('/',
	asyncErrorHandler(createKiosk)
)

/**
 * @route GET api/v1/kiosks/:id
 * @desc Get an kiosk
 * @access Public
 * @param {string} req.params.id - The id of the kiosk to be fetched.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The kiosk.
 */
router.get('/:id',
	asyncErrorHandler(getKiosk)
)

/**
 * @route GET api/v1/kiosks
 * @desc Get all kiosks
 * @access Public
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The kiosks.
 */
router.get('/',
	asyncErrorHandler(getKiosks)
)

/**
 * @route PATCH api/v1/kiosks/:id
 * @desc Update an kiosk
 * @access Public
 * @param {string} req.params.id - The id of the kiosk to be patched.
 * @param {string} [req.body.name] - The name of the kiosk (optional).
 * @param {string} [req.body.roomId] - The id of the room the kiosk is in (optional).
 * @param {string} [req.body.password] - The password of the kiosk (optional).
 * @param {string} [req.body.confirmPassword] - The password confirmation of the kiosk (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated kiosk.
 */
router.patch('/:id',
	asyncErrorHandler(patchKiosk)
)

/**
 * @route PATCH api/v1/kiosks/:id/kioskTag
 * @desc Create a new kioskTag
 * @access Public
 * @param {string} req.params.id - The id of the kiosk to be patched.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated kiosk.
 */
router.patch('/:id/kioskTag',
	asyncErrorHandler(createNewKioskTag)
)

/**
 * @route DELETE api/v1/kiosks/:id
 * @desc Delete an kiosk
 * @access Public
 * @param {string} req.params.id - The id of the kiosk to be deleted.
 * @param {boolean} req.body.confirm - Confirm the deletion.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	asyncErrorHandler(deleteKiosk)
)

export default router
