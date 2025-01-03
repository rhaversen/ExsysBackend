// Node.js built-in modules

// Third-party libraries

// Own modules
import { emitSocketEvent } from '../utils/socket.js'
import { type IOption } from '../models/Option.js'

// Environment variables

// Config variables

// Destructuring and global variables

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
