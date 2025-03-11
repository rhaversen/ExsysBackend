// Node.js built-in modules

// Third-party libraries
import { Server } from 'socket.io'
import config from './setupConfig.js'
import { type Server as HttpServer } from 'http'
import logger from './logger.js'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

// Own modules

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

export async function initSocket (server: HttpServer): Promise<void> {
	if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
		logger.info('Initializing socket.io for testing/development')
		io = new Server(server, {
			cors: corsConfig
		})
		io.on('connection', (socket) => {
			logger.silly(`Socket connected: ${socket.id}`)
		})
		return
	}

	logger.info('Initializing socket.io with Redis adapter')

	io = new Server(server, {
		cors: corsConfig
	})

	// Initialize Redis clients for pub and sub
	const pubClient = createClient({
		url: `redis://${redisHost}:${redisPort}`,
		password: redisPassword
	})
	const subClient = pubClient.duplicate()

	// Handle Redis client errors
	pubClient.on('error', (err) => { logger.error('Redis Pub Client Error:', err) })
	subClient.on('error', (err) => { logger.error('Redis Sub Client Error:', err) })

	// Connect to Redis
	await Promise.all([pubClient.connect(), subClient.connect()])

	// Use the Redis adapter
	io.adapter(createAdapter(pubClient, subClient, {
		// The key to use for storing presence data
		key: redisPrefix
	}))

	io.on('connection', (socket) => {
		logger.silly(`Socket connected: ${socket.id}`)
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

export function emitSocketEvent<T> (
	eventName: string,
	data: T,
	successLog: string
): void {
	const io = getSocket()

	try {
		io.emit(eventName, data)
		logger.silly(successLog)
	} catch (error) {
		logger.error(`Failed to emit ${eventName}:`, error)
	}
}

export function broadcastEvent(
	eventName: string,
	successLog: string
): boolean {
	const io = getSocket()

	try {
		io.emit(eventName)
		logger.silly(successLog)
		return true
	} catch (error) {
		logger.error(`Failed to emit ${eventName}:`, error)
		return false
	}
}
