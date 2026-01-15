import { IInteractionFrontend } from '../models/Interaction.js'
import { emitSocketEvent } from '../utils/socket.js'

export function emitInteractionCreated (interaction: IInteractionFrontend): void {
	emitSocketEvent<IInteractionFrontend>(
		'interactionCreated',
		interaction,
		`Broadcasted interaction created for session ${interaction.sessionId}`
	)
}

export function emitInteractionUpdated (interaction: IInteractionFrontend): void {
	emitSocketEvent<IInteractionFrontend>(
		'interactionUpdated',
		interaction,
		`Broadcasted interaction updated for session ${interaction.sessionId}`
	)
}

export function emitInteractionDeleted (interactionId: string): void {
	emitSocketEvent<string>(
		'interactionDeleted',
		interactionId,
		`Broadcasted interaction deleted for interaction ${interactionId}`
	)
}
