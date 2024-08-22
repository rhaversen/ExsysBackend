// Node.js built-in modules

// Third-party libraries
import Router from 'express'

// Own modules
import asyncErrorHandler from '../utils/asyncErrorHandler.js'
import { isAdmin } from '../middleware/authorization.js'

// Controller functions
import { createReader, deleteReader, getReaders, patchReader } from '../controllers/readerController.js'

// Destructuring and global variables
const router = Router()

/**
 * @route POST api/v1/readers
 * @desc Create a new reader
 * @access Private
 * @param {string} req.body.pairingCode - The pairing code of the reader.
 * @param {string} [req.body.readerTag] - The reader tag of the reader (optional).
 */
router.post('/',
	isAdmin,
	asyncErrorHandler(createReader)
)

/**
 * @route GET api/v1/readers
 * @desc Get all readers
 * @access Private
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The readers.
 */
router.get('/',
	isAdmin,
	asyncErrorHandler(getReaders)
)

/**
 * @route PATCH api/v1/readers/:id
 * @desc Update a reader
 * @access Private
 * @param {string} req.params.id - The id of the reader to be updated.
 * @param {string} [req.body.readerTag] - The reader tag of the reader.
 * @return {number} res.status - The status code of the HTTP response.
 * @return {object} res.body - The updated reader.
 */
router.patch('/:id',
	isAdmin,
	asyncErrorHandler(patchReader)
)

/**
 * @route DELETE api/v1/readers/:id
 * @desc Delete a reader
 * @access Private
 * @param {string} req.params.id - The id of the reader to be deleted.
 * @return {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	asyncErrorHandler(deleteReader)
)

export default router
