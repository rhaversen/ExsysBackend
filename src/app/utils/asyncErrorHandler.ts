// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type RequestHandler, type Response } from 'express'

// Own modules
import logger from './logger.js'

// Environment variables

// Config variables

// Destructuring and global variables

type AsyncMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>

const asyncErrorHandler = (fn: AsyncMiddleware): RequestHandler =>
	async (req, res, next) => {
		await fn(req, res, next).catch(error => {
			logger.info('Error caught by asyncErrorHandler')
			next(error)
		})
	}

export default asyncErrorHandler
