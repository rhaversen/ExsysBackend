import { type IAdminFrontend } from '../models/Admin.js'
import { emitSocketEvent } from '../utils/socket.js'

export function emitAdminCreated (admin: IAdminFrontend): void {
	emitSocketEvent<IAdminFrontend>(
		'adminCreated',
		admin,
		`Broadcasted admin created for admin ${admin._id}`
	)
}

export function emitAdminUpdated (admin: IAdminFrontend): void {
	emitSocketEvent<IAdminFrontend>(
		'adminUpdated',
		admin,
		`Broadcasted admin updated for admin ${admin._id}`
	)
}

export function emitAdminDeleted (adminId: string): void {
	emitSocketEvent<string>(
		'adminDeleted',
		adminId,
		`Broadcasted admin deleted for admin ${adminId}`
	)
}
