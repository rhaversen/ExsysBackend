import { IOptionFrontend } from '../models/Option.js'
import { emitSocketEvent } from '../utils/socket.js'

export function emitOptionCreated (option: IOptionFrontend): void {
	emitSocketEvent<IOptionFrontend>(
		'optionCreated',
		option,
		`Broadcasted option created for option ${option._id}`
	)
}

export function emitOptionUpdated (option: IOptionFrontend): void {
	emitSocketEvent<IOptionFrontend>(
		'optionUpdated',
		option,
		`Broadcasted option updated for option ${option._id}`
	)
}

export function emitOptionDeleted (optionId: string): void {
	emitSocketEvent<string>(
		'optionDeleted',
		optionId,
		`Broadcasted option deleted for option ${optionId}`
	)
}
