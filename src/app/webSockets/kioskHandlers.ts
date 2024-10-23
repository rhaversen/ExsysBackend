// Node.js built-in modules

// Third-party libraries

// Own modules
import { emitSocketEvent } from '../utils/socket.js'
import { type IKioskFrontend } from '../models/Kiosk.js'

// Environment variables

// Config variables

// Destructuring and global variables

export function emitKioskCreated (kiosk: IKioskFrontend): void {
	emitSocketEvent<IKioskFrontend>(
		'kioskCreated',
		kiosk,
		`Broadcasted kiosk created for kiosk ${kiosk._id}`
	)
}

export function emitKioskUpdated (kiosk: IKioskFrontend): void {
	emitSocketEvent<IKioskFrontend>(
		'kioskUpdated',
		kiosk,
		`Broadcasted kiosk updated for kiosk ${kiosk._id}`
	)
}

export function emitKioskDeleted (kioskId: string): void {
	emitSocketEvent<string>(
		'kioskDeleted',
		kioskId,
		`Broadcasted kiosk deleted for kiosk ${kioskId}`
	)
}
