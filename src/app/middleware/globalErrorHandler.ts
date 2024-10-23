// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'

// Own modules
import logger from '../utils/logger.js'

// Environment variables

// Config variables

// Destructuring and global variables

export default (function (err: Error, req: Request, res: Response, next: NextFunction): void {
	if (err.stack !== null && err.stack !== undefined && err.stack !== '') {
		logger.error(err.stack)
	} else if (err.message !== null && err.message !== undefined && err.message !== '') {
		logger.error('Error:', err.message)
	} else {
		logger.error(err)
	}

	res.status(500).json({ error: 'An error occurred, please try again later' })
})
