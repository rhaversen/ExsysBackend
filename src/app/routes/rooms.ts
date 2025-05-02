import { Router } from 'express'

import {
	createRoom,
	deleteRoom,
	getRoom,
	getRooms,
	patchRoom
} from '../controllers/roomController.js'
import { isAdmin, isAdminOrKiosk } from '../middleware/authorization.js'

const router = Router()

/**
 * @route POST /api/v1/rooms
 * @description Create a new room.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.body.name - The name of the room.
 * @param {string} req.body.description - The description of the room.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The newly created room.
 */
router.post('/',
	isAdmin,
	createRoom
)

/**
 * @route GET /api/v1/rooms/:id
 * @description Get a room by ID.
 * @access Private
 * @middleware isAdminOrKiosk
 * @param {string} req.params.id - The ID of the room to be fetched.
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The room details.
 */
router.get('/:id',
	isAdminOrKiosk,
	getRoom
)

/**
 * @route GET /api/v1/rooms
 * @description Get all rooms.
 * @access Private
 * @middleware isAdminOrKiosk
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Array<Object>} res.body - The list of rooms.
 */
router.get('/',
	isAdminOrKiosk,
	getRooms
)

/**
 * @route PATCH /api/v1/rooms/:id
 * @description Update a room by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the room to be updated.
 * @param {string} [req.body.name] - The name of the room (optional).
 * @param {string} [req.body.description] - The description of the room (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated room.
 */
router.patch('/:id',
	isAdmin,
	patchRoom
)

/**
 * @route DELETE /api/v1/rooms/:id
 * @description Delete a room by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the room to be deleted.
 * @param {boolean} req.body.confirm - Confirmation of the deletion.
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	deleteRoom
)

export default router
