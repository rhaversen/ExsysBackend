import { model, Schema } from 'mongoose'

import { IActivityFrontend } from './Activity'
import { IKioskFrontend } from './Kiosk'

// Interfaces
export interface ISession {
	_id: string // Session ID
	session: string // JSON string of session data
	expires: Date | null // Expiry date
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

// Compile the schema into a model
const Session = model<ISession>('Session', SessionSchema)

// Export the model
export default Session
