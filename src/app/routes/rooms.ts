// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'

// Controller functions
import { createRoom } from '../controllers/roomController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/rooms
 * @desc Create a new room
 * @access Public
 * @param {string} req.body.name - The name of the room.
 * @param {number} req.body.number - The number of the room.
 * @param {string} req.body.description - The description of the room.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The newly created room.
 */
router.post('/',
	asyncErrorHandler(createRoom)
)

export default router
