import { type NextFunction, type Request, type Response } from 'express'

import logger from '../utils/logger.js'

export function isAdmin (req: Request, res: Response, next: NextFunction): void {
	logger.silly('Checking if user is an admin')
	if (!req.isAuthenticated() || req.session.type !== 'admin') {
		res.status(403).send('Forbidden')
		return
	}
	next()
}

export function isKiosk (req: Request, res: Response, next: NextFunction): void {
	logger.silly('Checking if user is a kiosk')
	if (!req.isAuthenticated() || req.session.type !== 'kiosk') {
		res.status(403).send('Forbidden')
		return
	}
	next()
}

export function isAdminOrKiosk (req: Request, res: Response, next: NextFunction): void {
	logger.silly('Checking if user is a kiosk or an admin')
	if (!req.isAuthenticated() || (req.session.type !== 'kiosk' && req.session.type !== 'admin')) {
		res.status(403).send('Forbidden')
		return
	}
	next()
}
