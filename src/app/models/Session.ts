import { model, Schema } from 'mongoose'

import { transformSession } from '../controllers/sessionController.js' // Assumed import
import logger from '../utils/logger.js' // Added import
import { emitSessionCreated, emitSessionDeleted, emitSessionUpdated } from '../webSockets/sessionHandlers.js' // Assumed import

import { IActivityFrontend } from './Activity'
import { IKioskFrontend } from './Kiosk'

// Interfaces
export interface ISession {
	_id: string // Session ID
	session: string // JSON string of session data
	expires: Date // Expiry date
	_wasNew?: boolean // Internal flag for middleware
}

export interface ISessionFrontend {
	_id: string // Used for deletion, determining current session and key in list
	sessionExpires: Date | null // Used to determine if session is expired if stayLoggedIn is true (Uses rolling expiration) (ISO string)
	stayLoggedIn: boolean // Used to determine if session is persistent
	type: 'admin' | 'kiosk' | 'unknown' // Used to infer user information
	userId: IActivityFrontend['_id'] | IKioskFrontend['_id'] | null // Used to infer user information
	ipAddress: string // Ip address of the user
	loginTime: Date // Time of login (ISO string)
	lastActivity: Date // Time of last activity (ISO string)
	userAgent: string // Agent information
}

// Schema
const SessionSchema = new Schema<ISession>(
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
			required: true,
			index: { expires: '1m' } // Add TTL index for automatic cleanup by MongoDB
		}
	},
	{
		strict: false // Allow other fields potentially added by connect-mongo
	}
)

// Pre-save middleware
SessionSchema.pre('save', function (next) {
	this._wasNew = this.isNew
	if (this.isNew) {
		logger.debug(`Creating new session: ID "${this._id}"`)
	} else {
		logger.debug(`Updating session: ID "${this._id}"`)
	}
	next()
})

// Post-save middleware
SessionSchema.post('save', function (doc: ISession, next) {
	logger.debug(`Session saved successfully: ID ${doc._id}`)
	try {
		// transformSession would parse doc.session and construct ISessionFrontend
		const transformedSession = transformSession(doc)
		if (doc._wasNew ?? false) {
			emitSessionCreated(transformedSession)
		} else {
			emitSessionUpdated(transformedSession)
		}
	} catch (error) {
		logger.error(`Error emitting WebSocket event for Session ID ${doc._id} in post-save hook:`, { error })
	}
	if (doc._wasNew !== undefined) { delete doc._wasNew } // Clean up
	next()
})

// Post-deleteOne & findOneAndDelete middleware
// Note: TTL deletions by MongoDB will NOT trigger these hooks.
SessionSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, function (doc: ISession, next) {
	if (doc !== null && doc !== undefined) {
		logger.info(`Session deleted successfully: ID ${doc._id}`)
		try {
			emitSessionDeleted(doc._id) // Emit with ID
		} catch (error) {
			logger.error(`Error emitting WebSocket event for deleted Session ID ${doc._id} in post-delete hook:`, { error })
		}
	} else {
		logger.warn('Post-delete hook for Session triggered but no document was passed.')
	}
	next()
})

// Compile the schema into a model
const Session = model<ISession>('Session', SessionSchema)

// Export the model
export default Session
