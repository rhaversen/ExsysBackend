import { type NextFunction, type Request, type Response } from 'express'
import passport from 'passport'

import { type IAdmin } from '../models/Admin.js'
import { type IKiosk } from '../models/Kiosk.js'
import SessionModel from '../models/Session.js'
import logger from '../utils/logger.js'
import { getIPAddress } from '../utils/sessionUtils.js'
import config from '../utils/setupConfig.js'

import { transformAdmin } from './adminController.js'
import { transformKiosk } from './kioskController.js'

// Config variables
const { sessionExpiry } = config

export async function loginAdminLocal (req: Request, res: Response, next: NextFunction): Promise<void> {
	const adminName = req.body.name ?? 'N/A'
	logger.info(`Attempting local login for admin: ${adminName}`)

	// Check if name and password are provided
	if (req.body.name === undefined || req.body.password === undefined) {
		logger.warn(`Admin login failed: Missing name or password for admin: ${adminName}`)
		res.status(400).json({
			auth: false,
			error: 'Navn eller kodeord mangler'
		})
		return
	}

	passport.authenticate('admin-local', (err: Error | null, user: Express.User | false | null, info?: { message: string }) => { // Adjusted types
		if (err !== null && err !== undefined) {
			logger.error(`Admin login error during authentication for ${adminName}:`, { error: err })
			return res.status(500).json({
				auth: false,
				error: err.message
			})
		}

		if (user === null || user === undefined || user === false) {
			const message = info?.message ?? 'Authentication failed'
			logger.warn(`Admin login failed for ${adminName}: ${message}`)
			return res.status(401).json({
				auth: false,
				error: message
			})
		}

		req.logIn(user, async (loginErr) => {
			if (loginErr !== null && loginErr !== undefined) {
				logger.error(`Admin login error during req.logIn for ${adminName}:`, { error: loginErr })
				return res.status(500).json({
					auth: false,
					error: loginErr.message
				})
			}

			// Store session data
			try {
				req.session.ipAddress = getIPAddress(req)
				req.session.loginTime = new Date()
				req.session.userAgent = req.headers['user-agent']
				req.session.type = 'admin'

				// Set maxAge for persistent sessions if requested
				if (req.body.stayLoggedIn === true || req.body.stayLoggedIn === 'true') {
					logger.debug(`Setting persistent session for admin ${adminName}`)
					req.session.cookie.maxAge = sessionExpiry
				}

				const admin = user as IAdmin
				const transformedAdmin = transformAdmin(admin)

				logger.info(`Admin ${admin.name} (ID: ${admin.id}) logged in successfully. Session ID: ${req.sessionID}`)
				res.status(200).json({
					auth: true,
					user: transformedAdmin
				})
			} catch (sessionError) {
				logger.error(`Admin login failed: Error during session handling for ${adminName}:`, { error: sessionError })
				next(sessionError)
			}
		})
	})(req, res, next)
}

export async function loginKioskLocal (req: Request, res: Response, next: NextFunction): Promise<void> {
	const kioskTag = req.body.kioskTag ?? 'N/A'
	const override = req.body.override === true || req.body.override === 'true'
	logger.info(`Attempting local login for kiosk: ${kioskTag}${override ? ' (override active session check)' : ''}`)

	// Check if kioskTag and password are provided
	if (req.body.kioskTag === undefined || req.body.password === undefined) {
		logger.warn(`Kiosk login failed: Missing kioskTag or password for kiosk: ${kioskTag}`)
		res.status(400).json({
			auth: false,
			error: 'kioskTag eller kodeord mangler'
		})
		return
	}

	passport.authenticate('kiosk-local', async (err: Error | null, user: Express.User | false | null, info?: { message: string }) => {
		if (err !== null && err !== undefined) {
			logger.error(`Kiosk login error during authentication for ${kioskTag}:`, { error: err })
			return res.status(500).json({
				auth: false,
				error: err.message
			})
		}

		if (user === null || user === undefined || user === false) {
			const message = info?.message ?? 'Authentication failed'
			logger.warn(`Kiosk login failed for ${kioskTag}: ${message}`)
			return res.status(401).json({
				auth: false,
				error: message
			})
		}

		// User is authenticated, now check for existing sessions before logging in
		const kiosk = user as IKiosk

		if (!override) {
			try {
				// Check for existing sessions for this kiosk user ID
				const existingSession = await SessionModel.findOne({
					// We need to search within the stringified session data
					// This assumes the user ID is stored under session.passport.user
					session: { $regex: `"passport":{"user":"${kiosk.id}"}` },
					expires: { $gt: new Date() } // Only consider non-expired sessions
				}).lean().exec()

				if (existingSession !== null) {
					logger.warn(`Kiosk login blocked for ${kioskTag}: Active session found (ID: ${existingSession._id}). Use override if needed.`)
					res.status(409).json({
						auth: false,
						error: 'Denne kiosk har allerede en aktiv session. Brug override for at logge ind alligevel.'
					})
					return
				}
			} catch (sessionCheckError) {
				logger.error(`Kiosk login error during active session check for ${kioskTag}:`, { error: sessionCheckError })
				res.status(500).json({
					auth: false,
					error: 'Fejl ved kontrol af eksisterende sessioner.'
				})
				return
			}
		}

		req.logIn(user, async (loginErr) => {
			if (loginErr !== null && loginErr !== undefined) {
				logger.error(`Kiosk login error during req.logIn for ${kioskTag}:`, { error: loginErr })
				return res.status(500).json({
					auth: false,
					error: loginErr.message
				})
			}

			// Store session data
			try {
				req.session.ipAddress = getIPAddress(req)
				req.session.loginTime = new Date()
				req.session.userAgent = req.headers['user-agent']
				req.session.type = 'kiosk'

				// Set maxAge for persistent sessions always for kiosks
				logger.debug(`Setting persistent session for kiosk ${kioskTag}`)
				req.session.cookie.maxAge = sessionExpiry

				const transformedKiosk = transformKiosk(kiosk)

				logger.info(`Kiosk ${kiosk.kioskTag} (ID: ${kiosk.id}) logged in successfully. Session ID: ${req.sessionID}`)
				res.status(200).json({
					auth: true,
					user: transformedKiosk
				})
			} catch (sessionError) {
				logger.error(`Kiosk login failed: Error during session handling for ${kioskTag}:`, { error: sessionError })
				next(sessionError)
			}
		})
	})(req, res, next)
}

export async function logoutLocal (req: Request, res: Response, next: NextFunction): Promise<void> {
	const sessionId = req.sessionID
	const userType = req.session.type ?? 'unknown'
	const userId = (req.user as (IAdmin | IKiosk))?.id ?? 'unknown'
	logger.info(`Attempting logout for ${userType} user ID: ${userId}, Session ID: ${sessionId}`)

	req.logout(function (err) {
		if (err !== null && err !== undefined) {
			logger.error(`Logout error during req.logout for Session ID ${sessionId}:`, { error: err })
		}

		req.session.destroy(function (sessionErr) {
			if (sessionErr !== null && sessionErr !== undefined) {
				logger.error(`Logout error during session.destroy for Session ID ${sessionId}:`, { error: sessionErr })
				next(sessionErr)
				return
			}
			res.clearCookie('connect.sid')
			logger.info(`Logout successful for Session ID: ${sessionId}`)
			res.status(200).json({ message: 'Succesfuldt logget ud' })
		})
	})
}

export function ensureAuthenticated (req: Request, res: Response, next: NextFunction): void {
	logger.debug(`Ensuring authentication for request to ${req.originalUrl}, Session ID: ${req.sessionID}`)

	if (!req.isAuthenticated()) {
		logger.warn(`Authentication check failed for Session ID: ${req.sessionID}, Path: ${req.originalUrl}`)
		res.status(401).json({ message: 'Unauthorized' })
		return
	}
	logger.silly(`Authentication check passed for Session ID: ${req.sessionID}`)
	next()
}
