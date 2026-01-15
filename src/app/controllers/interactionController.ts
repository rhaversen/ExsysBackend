import { type NextFunction, type Request, type Response } from 'express'
import mongoose, { type FlattenMaps } from 'mongoose'

import InteractionModel, { type IInteraction, type IInteractionFrontend } from '../models/Interaction.js'
import { type IKiosk } from '../models/Kiosk.js'
import logger from '../utils/logger.js'
import { emitInteractionCreated } from '../webSockets/interactionHandlers.js'

interface InteractionInput {
	type: string
	timestamp: string
}

interface CreateInteractionsRequest extends Request {
	body: {
		sessionId: string
		interactions: InteractionInput[]
	}
}

export function transformInteraction (interaction: IInteraction | FlattenMaps<IInteraction>): IInteractionFrontend {
	return {
		_id: interaction._id.toString(),
		sessionId: interaction.sessionId,
		kioskId: interaction.kioskId.toString(),
		type: interaction.type,
		timestamp: interaction.timestamp.toISOString(),
		createdAt: interaction.createdAt.toISOString(),
		updatedAt: interaction.updatedAt.toISOString()
	}
}

export async function createInteractions (req: CreateInteractionsRequest, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Creating interactions batch')

	try {
		const { sessionId, interactions } = req.body
		const kiosk = req.user as IKiosk | undefined

		if (kiosk === undefined || kiosk === null) {
			res.status(401).json({ error: 'Kiosk ikke autentificeret' })
			return
		}

		if (sessionId === undefined || sessionId === null || typeof sessionId !== 'string') {
			res.status(400).json({ error: 'Session ID er påkrævet' })
			return
		}

		if (!Array.isArray(interactions) || interactions.length === 0) {
			res.status(400).json({ error: 'Interaktioner er påkrævet' })
			return
		}

		const docs = interactions.map(i => ({
			sessionId,
			kioskId: kiosk._id,
			type: i.type,
			timestamp: new Date(i.timestamp)
		}))

		const created = await InteractionModel.insertMany(docs)
		logger.info(`Created ${created.length} interactions for session ${sessionId}`)

		for (const interaction of created) {
			emitInteractionCreated(transformInteraction(interaction))
		}

		res.status(201).json({ created: created.length })
	} catch (error) {
		logger.error('Failed to create interactions', { error })
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getInteractions (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting interactions')

	try {
		const { sessionId, kioskId, from, to } = req.query

		const filter: Record<string, unknown> = {}

		if (sessionId !== undefined) {
			filter.sessionId = sessionId
		}

		if (kioskId !== undefined) {
			filter.kioskId = kioskId
		}

		if (from !== undefined || to !== undefined) {
			filter.timestamp = {}
			if (from !== undefined) {
				(filter.timestamp as Record<string, Date>).$gte = new Date(from as string)
			}
			if (to !== undefined) {
				(filter.timestamp as Record<string, Date>).$lte = new Date(to as string)
			}
		}

		const interactions = await InteractionModel.find(filter).sort({ timestamp: -1 }).lean()
		const transformed = interactions.map(i => transformInteraction(i))

		res.status(200).json(transformed)
	} catch (error) {
		logger.error('Failed to get interactions', { error })
		if (error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
