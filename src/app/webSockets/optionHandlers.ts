import { type IOption } from '../models/Option.js'
import { emitSocketEvent } from '../utils/socket.js'

export function emitOptionCreated (option: IOption): void {
	emitSocketEvent<IOption>(
		'optionCreated',
		option,
		`Broadcasted option created for option ${option.id}`
	)
}

export function emitOptionUpdated (option: IOption): void {
	emitSocketEvent<IOption>(
		'optionUpdated',
		option,
		`Broadcasted option updated for option ${option.id}`
	)
}

export function emitOptionDeleted (optionId: string): void {
	emitSocketEvent<string>(
		'optionDeleted',
		optionId,
		`Broadcasted option deleted for option ${optionId}`
	)
}
