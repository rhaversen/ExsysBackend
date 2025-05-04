import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

import Session, { type ISession, type ISessionFrontend } from '../models/Session.js'
import logger from '../utils/logger.js'
import { emitSessionDeleted } from '../webSockets/sessionHandlers.js'

export interface ParsedSessionData {
	cookie: {
		originalMaxAge: number | null
		expires: string | null // Can be null
		secure: boolean
		httpOnly: boolean
		path: string
	}
	passport?: {
		user: string // User ID (Admin or Kiosk ObjectId)
	}
	ipAddress: string
	loginTime: Date
	lastActivity: Date
	userAgent: string
	type?: 'admin' | 'kiosk'
}

export function transformSession (
	sessionDoc: ISession
): ISessionFrontend {
	logger.silly(`Transforming session document ID: ${sessionDoc._id}`)
	try {
		const sessionData = JSON.parse(sessionDoc.session) as ParsedSessionData
		const userId = sessionData?.passport?.user?.toString() ?? null // Safely access user ID

		// Determine stayLoggedIn based on originalMaxAge (null means session cookie)
		const stayLoggedIn = sessionData.cookie.originalMaxAge !== null

		return {
			_id: sessionDoc._id,
			sessionExpires: sessionDoc.expires, // Use expires from the session document, which reflects the actual DB expiry
			stayLoggedIn,
			type: sessionData.type ?? 'unknown', // Default to 'unknown' if type is missing
			userId,
			ipAddress: sessionData.ipAddress,
			loginTime: sessionData.loginTime,
			lastActivity: sessionData.lastActivity,
			userAgent: sessionData.userAgent
		}
	} catch (error) {
		logger.error(`Error transforming session document ID ${sessionDoc._id}:`, { error })
		// Return a default/error structure
		// Returning a minimal structure to avoid crashing consumers
		return {
			_id: sessionDoc._id,
			sessionExpires: null,
			stayLoggedIn: false,
			type: 'unknown',
			userId: null,
			ipAddress: 'Error',
			loginTime: new Date(0),
			lastActivity: new Date(0),
			userAgent: 'Error parsing session'
		}
	}
}

export async function getSessions (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting all active sessions')

	try {
		const sessions = await Session.find({}).lean().exec()
		logger.debug(`Found ${sessions.length} session documents in DB`)

		const transformedSessions = sessions.map((sessionDoc) =>
			transformSession(sessionDoc as ISession) // Cast needed with lean
		)

		logger.debug(`Retrieved and transformed ${transformedSessions.length} sessions`)
		res.status(200).json(transformedSessions)
	} catch (error) {
		logger.error('Failed to get sessions', { error })
		next(error)
	}
}

export async function getCurrentSession (req: Request, res: Response, next: NextFunction): Promise<void> {
	const sessionId = req.sessionID
	logger.debug(`Getting current session: ID ${sessionId}`)

	if (!sessionId) {
		// This case might occur if session middleware failed or cookie is missing
		logger.warn('Get current session failed: No session ID found in request.')
		res.status(401).json({ error: 'Ingen aktiv session fundet' })
		return
	}

	try {
		// Fetch directly using the current session ID
		const currentSession = await Session.findById(sessionId).lean().exec()

		if (currentSession === null) {
			// Session ID exists but not found in DB (e.g., expired and removed, or invalid ID)
			logger.warn(`Get current session failed: Session not found in DB. ID: ${sessionId}`)
			res.status(404).json({ error: 'Session ikke fundet' })
			return
		}

		const transformedSession = transformSession(currentSession as ISession) // Cast needed with lean
		logger.debug(`Retrieved current session successfully: ID ${sessionId}`)
		res.status(200).json(transformedSession)
	} catch (error) {
		logger.error(`Get current session failed: Error retrieving session ID ${sessionId}`, { error })
		next(error)
	}
}

export async function deleteSession (req: Request, res: Response, next: NextFunction): Promise<void> {
	const sessionId = req.params.id
	const requestingUser = req.user as { id: string, type: string } | undefined // Assuming user has id and type
	const requestingUserId = requestingUser?.id ?? 'Unknown'
	const requestingUserType = requestingUser?.type ?? 'Unknown'

	logger.info(`User ${requestingUserType} ID ${requestingUserId} attempting to delete session: ID ${sessionId}`) // Changed level and added context

	if (!mongoose.Types.ObjectId.isValid(sessionId) && typeof sessionId !== 'string') { // Also check if it's just a string session ID
		logger.warn(`Delete session failed: Invalid Session ID format: ${sessionId}`)
		res.status(400).json({ error: 'Invalid Session ID format' })
		return
	}

	try {
		// Find the session first to confirm existence
		const session = await Session.findById(sessionId).exec()

		if (session === null) {
			logger.warn(`Delete session failed: Session not found. ID: ${sessionId}`)
			res.status(404).json({ error: 'Session ikke fundet' })
			return
		}

		// Delete the session from the database
		await session.deleteOne()
		logger.info(`Session deleted successfully from DB: ID ${sessionId}`)

		// Respond 204 No Content
		res.status(204).send()

		// Emit WebSocket event after successful deletion and response
		emitSessionDeleted(sessionId)
	} catch (error) {
		logger.error(`Delete session failed: Error during deletion process for ID ${sessionId}`, { error })
		next(error)
	}
}
