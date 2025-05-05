import { type NextFunction, type Request, type Response } from 'express'

import { IAdmin } from '../models/Admin.js'
import { IKiosk } from '../models/Kiosk.js'
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

export function canCreateOrder (req: Request, res: Response, next: NextFunction): void {
	if (!req.isAuthenticated()) {
		logger.warn('canCreateOrder check failed: User not authenticated')
		res.status(403).send('Forbidden')
		return
	}

	const type = req.session.type as 'admin' | 'kiosk'
	const { checkoutMethod } = req.body
	const user = req.user as IAdmin | IKiosk

	logger.silly(`canCreateOrder check: User ${user.id}, Role ${type}, Method ${checkoutMethod ?? 'N/A'}`)

	if (type === 'admin') {
		if (checkoutMethod === 'manual') {
			logger.silly(`canCreateOrder check passed for admin ${user.id} with method 'manual'`)
			next()
		} else {
			logger.warn(`canCreateOrder check failed for admin ${user.id}: Invalid method '${checkoutMethod ?? 'N/A'}'. Admins can only use 'manual'.`)
			res.status(403).json({ error: 'Forbidden: Admins can only create orders with checkoutMethod \'manual\'' })
		}
	} else if (type === 'kiosk') {
		if (checkoutMethod === 'sumUp' || checkoutMethod === 'later') {
			logger.silly(`canCreateOrder check passed for kiosk ${user.id} with method '${checkoutMethod}'`)
			next()
		} else {
			logger.warn(`canCreateOrder check failed for kiosk ${user.id}: Invalid method '${checkoutMethod ?? 'N/A'}'. Kiosks can only use 'sumUp' or 'later'.`)
			res.status(403).json({ error: 'Forbidden: Kiosks can only create orders with checkoutMethod \'sumUp\' or \'later\'' })
		}
	} else {
		logger.error(`canCreateOrder check failed: User ${user.id} has unexpected role '${type}'`)
		res.status(403).json({ error: 'Forbidden: Invalid user role for creating orders' })
	}
}
