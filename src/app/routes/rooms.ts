// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { createRoom, deleteRoom, getRooms, patchRoom } from '../controllers/roomController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/rooms
 * @desc Create a new room
 * @access Public
 * @param {string} req.body.name - The name of the room.
 * @param {string} req.body.description - The description of the room.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created room.
 */
router.post('/',
	asyncErrorHandler(createRoom)
)

/**
 * @route GET api/v1/rooms
 * @desc Get all rooms
 * @access Public
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The rooms.
 */
router.get('/',
	asyncErrorHandler(getRooms)
)

/**
 * @route PATCH api/v1/rooms/:id
 * @desc Update a room
 * @access Public
 * @param {string} req.params.id - The id of the room to be patched.
 * @param {string} [req.body.name] - The name of the room (optional).
 * @param {string} [req.body.description] - The description of the room (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated room.
 */
router.patch('/:id',
	asyncErrorHandler(patchRoom)
)

/**
 * @route DELETE api/v1/rooms/:id
 * @desc Delete a room
 * @access Public
 * @param {string} req.params.id - The id of the room to be deleted.
 * @param {boolean} req.body.confirm - Confirm the deletion.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	asyncErrorHandler(deleteRoom)
)

export default router
