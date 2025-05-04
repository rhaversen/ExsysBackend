import { model, Schema } from 'mongoose'

// Interfaces
export interface ISession {
	_id: string // Session ID
	session: string // JSON string of session data
	expires: Date | null // Expiry date
}

export interface ISessionFrontend {
	_id: string
	sessionExpires: Date | null
	stayLoggedIn: boolean
	type: 'admin' | 'kiosk' | 'unknown'
	userId: string | null
	ipAddress: string
	loginTime: Date
	lastActivity: Date
	userAgent: string
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
