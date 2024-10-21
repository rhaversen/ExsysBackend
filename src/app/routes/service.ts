// Node.js built-in modules

// Third-party libraries
import { Router } from 'express'
import mongoose from 'mongoose'

// Own modules
import { getSocketStatus } from '../utils/socket.js'

// Destructuring and global variables
const router = Router()

/**
 * @route GET /api/service/livez
 * @description Check if the server is live.
 * @access Public
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/livez', (req, res) => {
	res.status(200).send('OK')
})

/**
 * @route GET /api/service/readyz
 * @description Check if the database and Socket.io are ready.
 * @access Public
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/readyz', (req, res) => {
	const mongooseReady = mongoose.connection.readyState === 1
	const socketReady = getSocketStatus()
	if (mongooseReady && socketReady) {
		return res.status(200).send('OK')
	} else {
		return res.status(503).send('Database or Socket.io unavailable')
	}
})

/**
 * @route GET /api/service/debug-sentry
 * @description Throw an error to test Sentry.
 * @access Public
 * @returns {number} res.status - The status code of the HTTP response.
 */
router.get('/debug-sentry', (req, res) => {
	throw new Error('Sentry error')
})

router.get('/ip', (request, response) => response.send(request.ip))
router.get('/ips', (request, response) => response.send(request.ips))
router.get('/hostname', (request, response) => response.send(request.hostname))
router.get('/protocol', (request, response) => response.send(request.protocol))
router.get('/secure', (request, response) => response.send(request.secure))
router.get('/subdomains', (request, response) => response.send(request.subdomains))
router.get('/x-forwarded-for', (request, response) => response.send(request.headers['x-forwarded-for']))
router.get('/x-forwarded-host', (request, response) => response.send(request.headers['x-forwarded-host']))
router.get('/forwarded', (request, response) => response.send(request.headers.forwarded))
router.get('/x-real-ip', (request, response) => response.send(request.headers['x-real-ip']))
router.get('/connection-remote-address', (request, response) => response.send(request.socket.remoteAddress))
router.get('/connection-remote-port', (request, response) => response.send(request.socket.remotePort))
router.get('/connection-local-address', (request, response) => response.send(request.socket.localAddress))
router.get('/connection-local-port', (request, response) => response.send(request.socket.localPort))

export default router
