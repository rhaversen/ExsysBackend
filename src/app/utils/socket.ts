// Node.js built-in modules

// Third-party libraries
import { Server } from 'socket.io'
import config from './setupConfig.js'
import { type Server as HttpServer } from 'http'
import logger from './logger.js'

// Configs
const {
	corsConfig
} = config

let io: Server | undefined

export function initSocket (server: HttpServer): Server {
	io = new Server(server,
		{
			cors: corsConfig
		}
	)

	return io
}

export function getSocket (): Server {
	logger.debug('Getting socket.io instance')
	if (io === null || io === undefined) {
		throw new Error('Socket.io is not initialized!')
	}
	return io
}
