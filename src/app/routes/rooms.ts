// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'
import { isAdmin } from '../middleware/authorization.js'

// Controller functions
import { createRoom, deleteRoom, getRoom, getRooms, patchRoom } from '../controllers/roomController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/rooms
 * @desc Create a new room
 * @access Private
 * @param {string} req.body.name - The name of the room.
 * @param {string} req.body.description - The description of the room.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created room.
 */
router.post('/',
	isAdmin,
	asyncErrorHandler(createRoom)
)

/**
 * @route GET api/v1/rooms/:id
 * @desc Get a room
 * @access Private
 * @param {string} req.params.id - The id of the room to be fetched.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The room.
 */
router.get('/:id',
	isAdmin,
	asyncErrorHandler(getRoom)
)

/**
 * @route GET api/v1/rooms
 * @desc Get all rooms
 * @access Private
 * @return {number} res.status - The status code of the HTTP response.
 * @return {Array<object>} res.body - The rooms.
 */
router.get('/',
	isAdmin,
	asyncErrorHandler(getRooms)
)

/**
 * @route PATCH api/v1/rooms/:id
 * @desc Update a room
 * @access Private
 * @param {string} req.params.id - The id of the room to be patched.
 * @param {string} [req.body.name] - The name of the room (optional).
 * @param {string} [req.body.description] - The description of the room (optional).
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated room.
 */
router.patch('/:id',
	isAdmin,
	asyncErrorHandler(patchRoom)
)

/**
 * @route DELETE api/v1/rooms/:id
 * @desc Delete a room
 * @access Private
 * @param {string} req.params.id - The id of the room to be deleted.
 * @param {boolean} req.body.confirm - Confirm the deletion.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	asyncErrorHandler(deleteRoom)
)

export default router
