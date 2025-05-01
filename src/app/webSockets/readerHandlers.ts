import { type IReaderFrontend } from '../models/Reader.js'
import { emitSocketEvent } from '../utils/socket.js'

export function emitReaderCreated (reader: IReaderFrontend): void {
	emitSocketEvent<IReaderFrontend>(
		'readerCreated',
		reader,
		`Broadcasted reader created for reader ${reader._id}`
	)
}

export function emitReaderUpdated (reader: IReaderFrontend): void {
	emitSocketEvent<IReaderFrontend>(
		'readerUpdated',
		reader,
		`Broadcasted reader updated for reader ${reader._id}`
	)
}

export function emitReaderDeleted (readerId: string): void {
	emitSocketEvent<string>(
		'readerDeleted',
		readerId,
		`Broadcasted reader deleted for reader ${readerId}`
	)
}
