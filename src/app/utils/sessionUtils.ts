// Node.js built-in modules

// Third-party libraries

// Own modules
import { type ISession } from '../models/Session.js'
import { type ParsedSessionData } from '../controllers/sessionController.js'

// Environment variables

// Config variables

// Destructuring and global variables

export interface TransformedSession {
	_id: string
	sessionExpires: Date | null
	stayLoggedIn: boolean
	type?: string
	userId: string | null
	ipAddress?: string
	loginTime?: Date
	lastActivity?: Date
	userAgent?: string
}

export function transformSession (
	sessionDoc: ISession
): TransformedSession {
	const sessionData = JSON.parse(sessionDoc.session) as ParsedSessionData
	const userId = sessionData?.passport?.user?.toString() ?? null

	const stayLoggedIn = sessionData.cookie.originalMaxAge !== null

	return {
		_id: sessionDoc._id,
		sessionExpires: stayLoggedIn ? sessionDoc.expires : null,
		stayLoggedIn,
		type: sessionData.type,
		userId,
		ipAddress: sessionData.ipAddress,
		loginTime: sessionData.loginTime,
		lastActivity: sessionData.lastActivity,
		userAgent: sessionData.userAgent
	}
}
