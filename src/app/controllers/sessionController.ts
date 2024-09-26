// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'

// Own modules
import Session from '../models/Session.js'
import { emitSessionDeleted } from '../webSockets/sessionHandlers.js'
import { transformSession } from '../utils/sessionUtils.js'

export interface ParsedSessionData {
	cookie: {
		originalMaxAge: number | null
		expires: any
		secure: any
		httpOnly: any
		path: any
	}
	passport?: {
		user: any
	}
	ipAddress?: string
	loginTime?: Date
	lastActivity?: Date
	userAgent?: string
	type?: string
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
