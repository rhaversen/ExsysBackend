import * as Sentry from '@sentry/node'
import mongoose from 'mongoose'

import { transformSession } from '../controllers/sessionController.js'
import SessionModel, { ISession } from '../models/Session.js'
import { emitSessionCreated, emitSessionDeleted, emitSessionUpdated } from '../webSockets/sessionHandlers.js'
import { shutDown } from '../index.js'

import logger from './logger.js'

let sessionChangeStream: mongoose.mongo.ChangeStream<ISession, mongoose.mongo.ChangeStreamDocument<ISession>> | undefined
let changeStreamRetryAttempts = 0
const MAX_CHANGE_STREAM_RETRIES = 5
const INITIAL_RETRY_DELAY_MS = 2000

export function initializeSessionChangeStream (): void {
	const sessionChangeStream = SessionModel.collection.watch<ISession>(
		[
		// Optionally filter specific operations, though defaults are usually fine
		// { $match: { operationType: { $in: ['insert', 'update', 'delete', 'replace'] } } }
		],
		{ fullDocument: 'updateLookup', fullDocumentBeforeChange: 'whenAvailable' }
	)

	sessionChangeStream.on('change', async (change) => {
		logger.debug(`Session change stream event: ${change.operationType}`, { changeId: change._id })

		try {
			if (change.operationType === 'insert') {
				const newSessionDoc = change.fullDocument
				if (newSessionDoc !== null) {
					const frontendSession = transformSession(newSessionDoc)
					emitSessionCreated(frontendSession)
					logger.info(`Session created via change stream: ID ${newSessionDoc._id}`)
				}
			} else if (change.operationType === 'update' || change.operationType === 'replace') {
				const updatedSessionDoc = change.fullDocument
				if (updatedSessionDoc !== null && updatedSessionDoc !== undefined) {
					const frontendSession = transformSession(updatedSessionDoc)
					emitSessionUpdated(frontendSession)
					logger.info(`Session updated via change stream: ID ${updatedSessionDoc._id}`)
				}
			} else if (change.operationType === 'delete') {
				const deletedSessionId = change.documentKey._id.toString()
				emitSessionDeleted(deletedSessionId)
				logger.info(`Session deleted via change stream: ID ${deletedSessionId}`)
			}
		} catch (error) {
			logger.error('Error processing session change stream event:', { error, changeId: change._id, operationType: change.operationType })
			Sentry.captureException(error, { extra: { changeStreamEvent: change } })
		}
	})

	sessionChangeStream.on('error', async (error: unknown) => {
		logger.error('Session change stream error:', { error })
		Sentry.captureException(error, { tags: { context: 'MongoDBChangeStreamError' } })
		
		await closeSessionChangeStream()
		if (changeStreamRetryAttempts < MAX_CHANGE_STREAM_RETRIES) {
			changeStreamRetryAttempts++
			const retryDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, changeStreamRetryAttempts - 1)
			logger.warn(`Session change stream errored. Attempting retry ${changeStreamRetryAttempts}/${MAX_CHANGE_STREAM_RETRIES} in ${retryDelay / 1000}s...`)
			setTimeout(() => {
				initializeSessionChangeStream()
			}, retryDelay)
		} else {
			logger.error(`Failed to re-initialize session change stream after ${MAX_CHANGE_STREAM_RETRIES} attempts. Shutting down application.`)
			await shutDown()
		}
	})

	if (changeStreamRetryAttempts > 0) {
		logger.info(`Session change stream successfully re-initialized after ${changeStreamRetryAttempts} attempt(s).`)
	}
	changeStreamRetryAttempts = 0
	logger.info('MongoDB change stream for sessions initialized.')
}

export async function closeSessionChangeStream (): Promise<void> {
	if (sessionChangeStream !== undefined) {
		await sessionChangeStream.close()
		sessionChangeStream = undefined
		logger.info('Session change stream closed.')
	} else {
		logger.warn('Session change stream was not initialized or already closed.')
	}
}
