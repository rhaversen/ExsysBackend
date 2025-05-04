import { broadcastEvent } from '../utils/socket.js'

export function emitForcedKioskRefresh (): boolean {
	return broadcastEvent(
		'kiosk-refresh',
		'Forced kiosk refresh'
	)
}
