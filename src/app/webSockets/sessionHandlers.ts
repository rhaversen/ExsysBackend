// Node.js built-in modules

// Own modules
import { emitSocketEvent } from '../utils/socket.js'
import { type TransformedSession } from '../utils/sessionUtils'

// Third-party libraries

export function emitSessionCreated (session: TransformedSession): void {
	emitSocketEvent<TransformedSession>(
		'sessionCreated',
		session,
		`Broadcasted session created for session ${session._id}`
	)
}

export function emitSessionUpdated (session: TransformedSession): void {
	emitSocketEvent<TransformedSession>(
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
