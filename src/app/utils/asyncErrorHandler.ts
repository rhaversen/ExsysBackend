import { type NextFunction, type Request, type RequestHandler, type Response } from 'express'
import logger from './logger.js'

type AsyncMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>

const asyncErrorHandler = (fn: AsyncMiddleware): RequestHandler =>
	async (req, res, next) => {
		await fn(req, res, next).catch(error => {
			logger.info('Error caught by asyncErrorHandler')
			next(error)
		})
	}

export default asyncErrorHandler
