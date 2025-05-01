import { type NextFunction, type Request, type Response } from 'express'

import Session, { type ISession, type ISessionFrontend } from '../models/Session.js'
import { emitSessionDeleted } from '../webSockets/sessionHandlers.js'

export interface ParsedSessionData {
	cookie: {
		originalMaxAge: number | null
		expires: string
		secure: string
		httpOnly: string
		path: string
	}
	passport?: {
		user: string
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
	const sessionData = JSON.parse(sessionDoc.session) as ParsedSessionData
	const userId = sessionData?.passport?.user?.toString() ?? null

	const stayLoggedIn = sessionData.cookie.originalMaxAge !== null

	return {
		_id: sessionDoc._id,
		sessionExpires: stayLoggedIn ? sessionDoc.expires : null,
		stayLoggedIn,
		type: sessionData.type ?? 'unknown',
		userId,
		ipAddress: sessionData.ipAddress,
		loginTime: sessionData.loginTime,
		lastActivity: sessionData.lastActivity,
		userAgent: sessionData.userAgent
	}
}

export async function getSessions (req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const sessions = await Session.find({}).exec()

		const transformedSessions = sessions.map((sessionDoc) =>
			transformSession(sessionDoc)
		)

		res.status(200).json(transformedSessions)
	} catch (error) {
		next(error)
	}
}

export async function getCurrentSession (req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const currentSession = await Session.findById(req.sessionID).exec()

		if (currentSession === null) {
			res.status(404).json({ error: 'Session ikke fundet' })
			return
		}

		const transformedSession = transformSession(currentSession)

		res.status(200).json(transformedSession)
	} catch (error) {
		next(error)
	}
}

export async function deleteSession (req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const sessionId = req.params.id
		const session = await Session.findById(sessionId).exec()

		if (session === null) {
			res.status(404).json({ error: 'Session ikke fundet' })
			return
		}

		await session.deleteOne()
		res.status(204).send()

		emitSessionDeleted(sessionId)
	} catch (error) {
		next(error)
	}
}
