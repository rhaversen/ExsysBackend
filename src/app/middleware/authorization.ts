import { type NextFunction, type Request, type Response } from 'express'

import logger from '../utils/logger.js'

export function isAdmin (req: Request, res: Response, next: NextFunction): void {
	logger.debug('Checking if user is an admin')
	if (!req.isAuthenticated() || req.session.type !== 'admin') {
		res.status(403).send('Forbidden')
		logger.debug('User is not an admin')
		return
	}
	logger.debug('User is an admin')
	next()
}

export function isKiosk (req: Request, res: Response, next: NextFunction): void {
	logger.debug('Checking if user is a kiosk')
	if (!req.isAuthenticated() || req.session.type !== 'kiosk') {
		res.status(403).send('Forbidden')
		logger.debug('User is not a kiosk')
		return
	}
	logger.debug('User is a kiosk')
	next()
}

export function isAdminOrKiosk (req: Request, res: Response, next: NextFunction): void {
	logger.debug('Checking if user is a kiosk or an admin')
	if (!req.isAuthenticated() || (req.session.type !== 'kiosk' && req.session.type !== 'admin')) {
		res.status(403).send('Forbidden')
		logger.debug('User is not a kiosk or an admin')
		return
	}
	logger.debug('User is a kiosk or an admin')
	next()
}
