// Node.js built-in modules
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { Logtail } from '@logtail/node'

// Third-party libraries
import { createLogger, format as _format, transports as _transports } from 'winston'

// Own modules

// Environment variables

// Config variables

// Destructuring and global variables
const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)
const logDirectory = join(_dirname, (['production', 'staging'].includes(process.env.NODE_ENV ?? '') ? './logs/' : '../../logs/'))

const winstonLogger = createLogger({
	levels: {
		error: 0,
		warn: 1,
		info: 2,
		http: 3,
		verbose: 4,
		debug: 5,
		silly: 6
	},
	format: _format.combine(
		_format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' }),
		_format.json(), // Use JSON format for logs
		_format.printf((logObject) => {
			return `${logObject.timestamp} ${logObject.level}: ${logObject.message}`
		})
	),
	defaultMeta: { service: 'exsys-backend' }, // Set a default metadata field
	transports: [
		new _transports.File({
			filename: join(logDirectory, '../../logs/error.log'),
			level: 'error'
		}),
		new _transports.File({
			filename: join(logDirectory, '../../logs/info.log'),
			level: 'info'
		}),
		new _transports.File({
			filename: join(logDirectory, '../../logs/combined.log'),
			level: 'silly'
		}),
		new _transports.Console({
			format: _format.combine(
				_format.colorize(),
				_format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
				_format.printf((logObject) => {
					return `${logObject.timestamp} ${logObject.level}: ${logObject.message}`
				})
			),
			level: process.env.NODE_ENV === 'development' ? 'silly' : 'info' // Log all levels in development, else log info and above
		})
	]
})

// Instantiate betterStackLogger only in production
let betterStackLogger: Logtail | null = null

function logToWinston (level: string, ...messages: any[]): void {
	const combinedMessage = messages.join(' ')
	switch (level) {
		case 'error':
			winstonLogger.error(combinedMessage)
			break
		case 'warn':
			winstonLogger.warn(combinedMessage)
			break
		case 'info':
			winstonLogger.info(combinedMessage)
			break
		case 'http':
			winstonLogger.http(combinedMessage)
			break
		case 'verbose':
			winstonLogger.verbose(combinedMessage)
			break
		case 'debug':
			winstonLogger.debug(combinedMessage)
			break
		case 'silly':
			winstonLogger.silly(combinedMessage)
			break
	}
}

async function logToBetterStack (level: string, ...messages: any[]): Promise<void> {
	if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
		return
	}

	if (betterStackLogger === null || betterStackLogger === undefined) {
		betterStackLogger = new Logtail(process.env.BETTERSTACK_LOG_TOKEN ?? '')
	}

	const combinedMessage = messages.join(' ')
	switch (level) {
		case 'error':
			await betterStackLogger.error(combinedMessage)
			break
		case 'warn':
			await betterStackLogger.warn(combinedMessage)
			break
		case 'info':
			await betterStackLogger.info(combinedMessage)
			break
		default:
			await betterStackLogger.debug(combinedMessage)
	}
}

function log (level: string, ...messages: unknown[]): void {
	logToWinston(level, messages)
	logToBetterStack(level, messages)
		.catch((error) => {
			logToWinston('error', `Error logging to BetterStack: ${error instanceof Error ? error.toString() : String(error)}`)
		})
}

const logger = {
	error: (...messages: unknown[]) => {
		log('error', ...messages)
	},
	warn: (...messages: unknown[]) => {
		log('warn', ...messages)
	},
	info: (...messages: unknown[]) => {
		log('info', ...messages)
	},
	http: (...messages: unknown[]) => {
		log('http', ...messages)
	},
	verbose: (...messages: unknown[]) => {
		log('verbose', ...messages)
	},
	debug: (...messages: unknown[]) => {
		log('debug', ...messages)
	},
	silly: (...messages: unknown[]) => {
		log('silly', ...messages)
	}
}

export default logger
