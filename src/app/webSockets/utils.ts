import { broadcastEvent, emitToRoom } from '../utils/socket.js'

// Emit a forced kiosk refresh event. If kioskId is provided, only that kiosk is refreshed.
export function emitForcedKioskRefresh (kioskId?: string): boolean {
	if (kioskId !== undefined) {
		return emitToRoom(
			kioskId,
			'kiosk-refresh',
			`Forced kiosk refresh for kiosk ${kioskId}`
		)
	}
	return broadcastEvent(
		'kiosk-refresh',
		'Forced kiosk refresh to all kiosks'
	)
}
