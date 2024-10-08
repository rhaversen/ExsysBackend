// Node.js built-in modules

// Third-party libraries
import passport from 'passport'
import { type NextFunction, type Request, type Response } from 'express'

// Own modules
import config from '../utils/setupConfig.js'
import logger from '../utils/logger.js'
import { type IAdmin } from '../models/Admin.js'
import { type IKiosk } from '../models/Kiosk.js'
import { emitSessionCreated, emitSessionDeleted } from '../webSockets/sessionHandlers.js'
import { type ISession } from '../models/Session.js'
import { transformSession } from '../utils/sessionUtils.js'

// Extend the Session interface to include ipAddress
declare module 'express-session' {
	interface Session {
		ipAddress?: string
		loginTime?: Date
		lastActivity?: Date
		userAgent?: string
		type?: string
	}
}

// Config
const {
	sessionExpiry
} = config

export async function loginAdminLocal (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Logging in admin')

	// Check if name and password are provided
	if (req.body.name === undefined || req.body.password === undefined) {
		res.status(400).json({
			auth: false,
			error: 'Navn eller kodeord mangler'
		})
		return
	}

	passport.authenticate('admin-local', (err: Error, user: Express.User, info: { message: string }) => {
		if (err !== null && err !== undefined) {
			return res.status(500).json({
				auth: false,
				error: err.message
			})
		}

		if (user === null || user === undefined || user === false) {
			return res.status(401).json({
				auth: false,
				error: info.message
			})
		}

		req.logIn(user, loginErr => {
			if (loginErr !== null && loginErr !== undefined) {
				return res.status(500).json({
					auth: false,
					error: loginErr.message
				})
			}

			// Store session data
			req.session.ipAddress = req.ip ?? 'Ukendt IP'
			req.session.loginTime = new Date()
			req.session.userAgent = req.headers['user-agent']
			req.session.type = 'admin'

			// Set maxAge for persistent sessions if requested
			if (req.body.stayLoggedIn === true || req.body.stayLoggedIn === 'true') {
				req.session.cookie.maxAge = sessionExpiry
			}

			const sessionDoc: ISession = {
				_id: req.sessionID,
				session: JSON.stringify(req.session),
				expires: req.session.cookie.expires ?? null
			}
			const transformedSession = transformSession(sessionDoc)

			logger.silly(`Admin ${(user as IAdmin).name} logged in`)
			res.status(200).json({
				auth: true,
				user
			})

			emitSessionCreated(transformedSession)
		})
	})(req, res, next)
}

export async function loginKioskLocal (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Logging in kiosk')

	// Check if kioskTag and password are provided
	if (req.body.kioskTag === undefined || req.body.password === undefined) {
		res.status(400).json({
			auth: false,
			error: 'kioskTag eller kodeord mangler'
		})
		return
	}

	passport.authenticate('kiosk-local', (err: Error, user: Express.User, info: { message: string }) => {
		if (err !== null && err !== undefined) {
			return res.status(500).json({
				auth: false,
				error: err.message
			})
		}

		if (user === null || user === undefined || user === false) {
			return res.status(401).json({
				auth: false,
				error: info.message
			})
		}

		req.logIn(user, loginErr => {
			if (loginErr !== null && loginErr !== undefined) {
				return res.status(500).json({
					auth: false,
					error: loginErr.message
				})
			}

			// Store session data
			req.session.ipAddress = req.ip ?? 'Ukendt IP'
			req.session.loginTime = new Date()
			req.session.userAgent = req.headers['user-agent']
			req.session.type = 'kiosk'

			// Set maxAge for persistent sessions always
			req.session.cookie.maxAge = sessionExpiry

			const sessionDoc: ISession = {
				_id: req.sessionID,
				session: JSON.stringify(req.session),
				expires: req.session.cookie.expires ?? null
			}
			const transformedSession = transformSession(sessionDoc)

			logger.silly(`Kiosk ${(user as IKiosk).kioskTag} logged in`)
			res.status(200).json({
				auth: true,
				user
			})

			emitSessionCreated(transformedSession)
		})
	})(req, res, next)
}

export async function logoutLocal (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Logging out')

	emitSessionDeleted(req.sessionID)

	req.logout(function (err) {
		if (err !== null && err !== undefined) {
			next(err)
			return
		}

		req.session.destroy(function (sessionErr) {
			if (sessionErr !== null && sessionErr !== undefined) {
				next(sessionErr)
				return
			}
			res.clearCookie('connect.sid')
			res.status(200).json({ message: 'Succesfuldt logget ud' })
		})
	})
}

export function ensureAuthenticated (req: Request, res: Response, next: NextFunction): void {
	logger.silly('Ensuring authentication')

	if (!req.isAuthenticated()) {
		res.status(401).json({ message: 'Unauthorized' })
		return
	}
	next()
}
