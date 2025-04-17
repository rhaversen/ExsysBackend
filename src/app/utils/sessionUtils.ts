// Node.js built-in modules

// Third-party libraries
import type express from 'express'
import { publicIpv4 } from 'public-ip'

// Own modules
import { type ISession } from '../models/Session.js'
import { type ParsedSessionData } from '../controllers/sessionController.js'

// Environment variables

// Config variables

// Destructuring and global variables
const serverIp = await publicIpv4() // Get the server's public IP address

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


export const getIPAddress = (req: express.Request): string => {
	// If the request is from localhost or a private IP, set the session IP address to the server's IP
	if (req.ip === undefined) {
		return 'Ukendt IP'
	} else if (req.ip === '::1' || req.ip === '127.0. 0.1' || req.ip?.includes('192.168')) {
		return serverIp
	} else {
		return req.ip
	}
}