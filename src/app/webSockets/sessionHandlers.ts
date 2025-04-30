// Node.js built-in modules

// Third-party libraries

// Own modules
import { ISessionFrontend } from '../models/Session.js'
import { emitSocketEvent } from '../utils/socket.js'

// Environment variables

// Config variables

// Destructuring and global variables

export function emitSessionCreated (session: ISessionFrontend): void {
	emitSocketEvent<ISessionFrontend>(
		'sessionCreated',
		session,
		`Broadcasted session created for session ${session._id}`
	)
}

export function emitSessionUpdated (session: ISessionFrontend): void {
	emitSocketEvent<ISessionFrontend>(
		'sessionUpdated',
		session,
		`Broadcasted session updated for session ${session._id}`
	)
}

export function emitSessionDeleted (sessionId: string): void {
	emitSocketEvent<string>(
		'sessionDeleted',
		sessionId,
		`Broadcasted session deleted for session ${sessionId}`
	)
}
