import { IRoomFrontend } from '../models/Room.js'
import { emitSocketEvent } from '../utils/socket.js'

export function emitRoomCreated (room: IRoomFrontend): void {
	emitSocketEvent<IRoomFrontend>(
		'roomCreated',
		room,
		`Broadcasted room created for room ${room._id}`
	)
}

export function emitRoomUpdated (room: IRoomFrontend): void {
	emitSocketEvent<IRoomFrontend>(
		'roomUpdated',
		room,
		`Broadcasted room updated for room ${room._id}`
	)
}

export function emitRoomDeleted (roomId: string): void {
	emitSocketEvent<string>(
		'roomDeleted',
		roomId,
		`Broadcasted room deleted for room ${roomId}`
	)
}
