import { type Server as HttpServer } from 'http'

import { createAdapter } from '@socket.io/redis-adapter'
import { type RequestHandler } from 'express'
import { type Session } from 'express-session'
import { createClient } from 'redis'
import { Server } from 'socket.io'

import logger from './logger.js'
import config from './setupConfig.js'

// Environment variables
const redisHost = process.env.REDIS_HOST
const redisPort = process.env.REDIS_PORT
const redisPassword = process.env.REDIS_PASSWORD

// Config variables
const {
	corsConfig,
	redisPrefix
} = config

// Destructuring and global variables
let io: Server | undefined

interface SocketRequest {
	session?: Session
}

export async function initSocket (server: HttpServer, sessionMiddleware: RequestHandler): Promise<void> {
	if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
		logger.debug('Initializing socket.io for testing/development')
		io = new Server(server, {
			cors: corsConfig
		})

		// Wrap Express session middleware for Socket.io
		io.engine.use(sessionMiddleware)

		// Authenticate Socket.io connections
		io.use((socket, next) => {
			const req = socket.request as unknown as SocketRequest
			const session = req.session
			if (session?.passport?.user !== undefined && session.passport.user !== null) {
				logger.debug(`Socket authentication successful for user: ${session.passport.user}`)
				next()
			} else {
				logger.warn('Socket authentication failed: No valid session')
				next(new Error('Unauthorized'))
			}
		})

		io.on('connection', (socket) => {
			const req = socket.request as unknown as SocketRequest
			const userType = req.session?.type
			const userId = req.session?.passport?.user
			logger.info(`Authenticated socket connected: ${socket.id}, user: ${userId ?? 'unknown'}, type: ${userType ?? 'unknown'}`)
		})
		return
	}

	logger.debug('Initializing socket.io with Redis adapter')

	io = new Server(server, {
		cors: corsConfig
	})

	// Wrap Express session middleware for Socket.io
	io.engine.use(sessionMiddleware)

	// Authenticate Socket.io connections
	io.use((socket, next) => {
		const req = socket.request as unknown as SocketRequest
		const session = req.session
		if (session?.passport?.user !== undefined && session.passport.user !== null) {
			logger.debug(`Socket authentication successful for user: ${session.passport.user}`)
			next()
		} else {
			logger.warn('Socket authentication failed: No valid session')
			next(new Error('Unauthorized'))
		}
	})

	// Initialize Redis clients for pub and sub
	const pubClient = createClient({
		url: `redis://${redisHost}:${redisPort}`,
		password: redisPassword
	})
	const subClient = pubClient.duplicate()

	// Handle Redis client errors
	pubClient.on('error', (err) => { logger.error('Redis Pub Client Error:', { error: err }) })
	subClient.on('error', (err) => { logger.error('Redis Sub Client Error:', { error: err }) })

	// Connect to Redis
	await Promise.all([pubClient.connect(), subClient.connect()])

	// Use the Redis adapter
	io.adapter(createAdapter(pubClient, subClient, {
		// The key to use for storing presence data
		key: redisPrefix
	}))

	io.on('connection', (socket) => {
		const req = socket.request as unknown as SocketRequest
		const userType = req.session?.type
		const userId = req.session?.passport?.user
		logger.info(`Authenticated socket connected: ${socket.id}, user: ${userId ?? 'unknown'}, type: ${userType ?? 'unknown'}`)
	})
}

export function getSocket (): Server {
	logger.silly('Getting socket.io instance')
	if (io === null || io === undefined) {
		throw new Error('Socket.io is not initialized!')
	}
	return io
}

export function getSocketStatus (): boolean {
	return io !== null && io !== undefined
}

function emitSocketEventImpl<T> (
	eventName: string,
	data: T,
	successLog: string
): void {
	const io = getSocket()

	try {
		io.emit(eventName, data)
		logger.debug(successLog)
	} catch (error) {
		logger.error(`Failed to emit ${eventName}:`, { error })
	}
}

function broadcastEventImpl (
	eventName: string,
	successLog: string
): boolean {
	const io = getSocket()

	try {
		io.emit(eventName)
		logger.debug(successLog)
		return true
	} catch (error) {
		logger.error(`Failed to broadcast ${eventName}:`, { error })
		return false
	}
}

export const socketEmitters = {
	emitSocketEvent: emitSocketEventImpl,
	broadcastEvent: broadcastEventImpl
}

export function emitSocketEvent<T> (
	eventName: string,
	data: T,
	successLog: string
): void {
	socketEmitters.emitSocketEvent(eventName, data, successLog)
}

export function broadcastEvent (
	eventName: string,
	successLog: string
): boolean {
	return socketEmitters.broadcastEvent(eventName, successLog)
}
