// Node.js built-in modules

// Third-party libraries

// Own modules
import { broadcastEvent } from '../utils/socket.js'

// Environment variables

// Config variables

// Destructuring and global variables

export function emitForcedKioskRefresh (): boolean {
	return broadcastEvent(
		'kiosk-refresh',
		'Forced kiosk refresh'
	)
}
