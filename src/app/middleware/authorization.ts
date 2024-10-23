// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'

// Own modules
import Admin, { type IAdmin } from '../models/Admin.js'
import Kiosk, { type IKiosk } from '../models/Kiosk.js'
import logger from '../utils/logger.js'

// Environment variables

// Config variables

// Destructuring and global variables

type User = IKiosk | IAdmin | undefined

export function isAdmin (req: Request, res: Response, next: NextFunction): void {
	logger.silly('Checking if user is an admin')
	const user = req.user as User
	if (!req.isAuthenticated() || user === undefined || !(user instanceof Admin)) {
		res.status(403).send('Forbidden')
		return
	}
	next()
}

export function isKiosk (req: Request, res: Response, next: NextFunction): void {
	logger.silly('Checking if user is a kiosk')
	const user = req.user as User
	if (!req.isAuthenticated() || user === undefined || !(user instanceof Kiosk)) {
		res.status(403).send('Forbidden')
		return
	}
	next()
}

export function isAdminOrKiosk (req: Request, res: Response, next: NextFunction): void {
	logger.silly('Checking if user is a kiosk or an admin')
	const user = req.user as User
	if (!req.isAuthenticated() || user === undefined) {
		res.status(403).send('Forbidden')
		return
	}
	next()
}
