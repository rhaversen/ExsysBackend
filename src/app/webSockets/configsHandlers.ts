import { IConfigsFrontend } from '../models/Configs.js'
import { emitSocketEvent } from '../utils/socket.js'

export function emitConfigsUpdated (configs: IConfigsFrontend): void {
	emitSocketEvent<IConfigsFrontend>(
		'configsUpdated',
		configs,
		'Broadcasted configs updated'
	)
}
