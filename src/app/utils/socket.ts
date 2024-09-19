// Node.js built-in modules

// Third-party libraries
import { Server } from 'socket.io'
import config from './setupConfig.js'
import { type Server as HttpServer } from 'http'
import logger from './logger.js'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

// Configs
const {
	corsConfig,
	redisPrefix
} = config

// Global variables
const redisHost = process.env.REDIS_HOST
const redisPort = process.env.REDIS_PORT
const redisPassword = process.env.REDIS_PASSWORD

let io: Server | undefined

export async function initSocket (server: HttpServer): Promise<Server> {
	if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
		logger.debug('Initializing socket.io for testing/development')
		io = new Server(server)
		return io
	}

	logger.info('Initializing socket.io with Redis adapter')

	if (redisHost === undefined || redisPort === undefined) {
		throw new Error('Redis host and port must be defined!')
	}

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
		logger.info(`Socket connected: ${socket.id}`)
		// Additional connection logic if necessary
	})

	return io
}

export function getSocket (): Server {
	logger.debug('Getting socket.io instance')
	if (io === null || io === undefined) {
		throw new Error('Socket.io is not initialized!')
	}
	return io
}
