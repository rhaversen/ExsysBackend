// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'
import { isAdmin, isAdminOrKiosk } from '../middleware/authorization.js'

// Controller functions
import { createKiosk, deleteKiosk, getKiosk, getKiosks, createNewKioskTag, patchKiosk } from '../controllers/kioskController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/kiosks
 * @desc Create a new kiosk
 * @access Private
 * @param {string} req.body.name - The name of the kiosk.
 * @param {string} [req.body.kioskTag] - The tag of the kiosk.
 * @param {string} req.body.password - The password of the kiosk.
 * @param {string} req.body.confirmPassword - The password confirmation of the kiosk.
 * @param {Array<{activityId: Types.ObjectId}>} [req.body.activities] - The activities the kiosk is responsible for.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created kiosk.
 */
router.post('/',
	isAdmin,
	asyncErrorHandler(createKiosk)
)

/**
 * @route GET api/v1/kiosks/:id
 * @desc Get an kiosk
 * @access Private
 * @param {string} req.params.id - The id of the kiosk to be fetched.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The kiosk.
 */
router.get('/:id',
	isAdminOrKiosk,
	asyncErrorHandler(getKiosk)
)

/**
 * @route GET api/v1/kiosks
 * @desc Get all kiosks
 * @access Private
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The kiosks.
 */
router.get('/',
	isAdmin,
	asyncErrorHandler(getKiosks)
)

/**
 * @route PATCH api/v1/kiosks/:id
 * @desc Update an kiosk
 * @access Private
 * @param {string} req.params.id - The id of the kiosk to be patched.
 * @param {string} [req.body.name] - The name of the kiosk (optional).
 * @param {string} [req.body.kioskTag] - The tag of the kiosk (optional).
 * @param {string} [req.body.password] - The password of the kiosk (optional).
 * @param {string} [req.body.confirmPassword] - The password confirmation of the kiosk (optional).
 * @param {Array<{activityId: Types.ObjectId}>} [req.body.activities] - The activities the kiosk is responsible for (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated kiosk.
 */
router.patch('/:id',
	isAdmin,
	asyncErrorHandler(patchKiosk)
)

/**
 * @route PATCH api/v1/kiosks/:id/kioskTag
 * @desc Create a new kioskTag
 * @access Private
 * @param {string} req.params.id - The id of the kiosk to be patched.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated kiosk.
 */
router.patch('/:id/kioskTag',
	isAdmin,
	asyncErrorHandler(createNewKioskTag)
)

/**
 * @route DELETE api/v1/kiosks/:id
 * @desc Delete an kiosk
 * @access Private
 * @param {string} req.params.id - The id of the kiosk to be deleted.
 * @param {boolean} req.body.confirm - Confirm the deletion.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	asyncErrorHandler(deleteKiosk)
)

export default router
