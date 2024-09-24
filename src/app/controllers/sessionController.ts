import { type NextFunction, type Request, type Response } from 'express'
import mongoose, { Schema } from 'mongoose'
import AdminModel from '../models/Admin.js'
import KioskModel from '../models/Kiosk.js'

const SessionSchema = new Schema(
	{
		_id: {
			type: String,
			required: true
		},
		session: {
			type: String,
			required: true
		},
		expires: {
			type: Date,
			required: true
		}
	},
	{ strict: false } // Allow other fields
)

export const Session = mongoose.model('Session', SessionSchema, 'sessions')

interface ParsedSessionData {
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
}

export async function getSessions (req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const sessions = await Session.find({}).exec()

		// Extract user IDs and parse session data
		const userSessions = sessions.map((sessionDoc) => {
			const sessionData = JSON.parse(sessionDoc.session) as ParsedSessionData
			const userId = sessionData?.passport?.user?.toString()
			return {
				sessionDoc,
				sessionData,
				userId
			}
		})

		// Collect unique user IDs
		const userIds = Array.from(
			new Set(userSessions.map(({ userId }) => userId).filter(Boolean))
		)

		// Fetch admins and kiosks in bulk
		const [admins, kiosks] = await Promise.all([
			AdminModel.find({ _id: { $in: userIds } }, '_id').exec(),
			KioskModel.find({ _id: { $in: userIds } }, '_id').exec()
		])

		const adminIds = new Set(admins.map((admin) => admin.id))
		const kioskIds = new Set(kiosks.map((kiosk) => kiosk.id))

		// Transform sessions
		const transformedSessions = userSessions.map(
			({
				sessionDoc,
				sessionData,
				userId
			}) => {
				let type = 'unknown'
				if (userId !== null) {
					if (adminIds.has(userId)) {
						type = 'admin'
					} else if (kioskIds.has(userId)) {
						type = 'kiosk'
					}
				}
				return {
					_id: sessionDoc._id,
					sessionExpires: sessionDoc.expires,
					originalMaxAge: sessionData.cookie.originalMaxAge,
					type,
					userId: userId ?? null,
					ipAddress: sessionData.ipAddress,
					loginTime: sessionData.loginTime,
					lastActivity: sessionData.lastActivity,
					userAgent: sessionData.userAgent,
					isCurrentSession: sessionDoc._id === req.sessionID
				}
			}
		)

		res.status(200).json(transformedSessions)
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
	} catch (error) {
		next(error)
	}
}
