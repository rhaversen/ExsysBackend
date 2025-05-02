import { Router } from 'express'

import {
	createReader,
	deleteReader,
	getReaders,
	patchReader
} from '../controllers/readerController.js'
import { isAdmin } from '../middleware/authorization.js'

const router = Router()

/**
 * @route POST /api/v1/readers
 * @description Create a new reader.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.body.pairingCode - The pairing code of the reader.
 * @param {string} [req.body.readerTag] - The reader tag of the reader (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The newly created reader.
 */
router.post('/',
	isAdmin,
	createReader
)

/**
 * @route GET /api/v1/readers
 * @description Get all readers.
 * @access Private
 * @middleware isAdmin
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Array<Object>} res.body - The list of readers.
 */
router.get('/',
	isAdmin,
	getReaders
)

/**
 * @route PATCH /api/v1/readers/:id
 * @description Update a reader by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the reader to be updated.
 * @param {string} [req.body.readerTag] - The new reader tag of the reader (optional).
 * @returns {number} res.status - The status code of the HTTP response.
 * @returns {Object} res.body - The updated reader.
 */
router.patch('/:id',
	isAdmin,
	patchReader
)

/**
 * @route DELETE /api/v1/readers/:id
 * @description Delete a reader by ID.
 * @access Private
 * @middleware isAdmin
 * @param {string} req.params.id - The ID of the reader to be deleted.
 * @param {boolean} req.body.confirm - Confirmation of the deletion.
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.delete('/:id',
	isAdmin,
	deleteReader
)

export default router
