// Node.js built-in modules

// Third-party libraries

// Own modules
import { emitSocketEvent } from '../utils/socket.js'
import { IConfigsFrontend } from '../models/Configs.js'

// Environment variables

// Config variables

// Destructuring and global variables

export function emitConfigsUpdated(configs: IConfigsFrontend): void {
	emitSocketEvent<IConfigsFrontend>(
		'configsUpdated',
		configs,
		'Broadcasted configs updated'
	)
}
