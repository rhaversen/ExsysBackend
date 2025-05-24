import { type NextFunction, type Request, type Response } from 'express'

import logger from '../utils/logger.js'

export default (function (err: Error, req: Request, res: Response, next: NextFunction): void {
	// Prefer logging the stack trace if available
	if (err.stack !== null && err.stack !== undefined && err.stack !== '') {
		logger.error('Unhandled error', { error: err, stack: err.stack })
	} else {
		// Fallback to logging the error object itself if stack is not available
		logger.error('Unhandled error', { error: err })
	}

	res.status(500).json({ error: 'Der skete en fejl, prøv igen senere' })
	next()
})
