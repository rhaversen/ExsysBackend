// Node.js built-in modules
import 'process'

// Third-party libraries

// Own modules
import logger from './logger.js'

// Environment variables

// Config variables

// Destructuring and global variables
const envSecrets = [
	// Database
	'DB_NAME',
	'DB_USER',
	'DB_PASSWORD',
	'DB_HOST',
	// Misc
	'BETTERSTACK_LOG_TOKEN',
	'NODE_ENV',
	'SESSION_SECRET',
	'SENTRY_DSN',
	// SumUp
	'SUMUP_MERCHANT_CODE',
	'SUMUP_API_KEY',
	// Redis
	'REDIS_HOST',
	'REDIS_PORT',
	'REDIS_PASSWORD'
]

const envSecretsDev = [
	'NODE_ENV',
	'SESSION_SECRET',
	'SUMUP_API_KEY',
	'SUMUP_MERCHANT_CODE'
]

// Verify that all environment secrets are set
const missingSecrets = [] as string[]
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
	envSecretsDev.forEach((secret) => {
		if (process.env[secret] === undefined) {
			missingSecrets.push(secret)
		}
	})
} else if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
	envSecrets.forEach((secret) => {
		if (process.env[secret] === undefined) {
			missingSecrets.push(secret)
		}
	})
}

if (missingSecrets.length > 0) {
	logger.error(`Missing environment secrets: ${missingSecrets.join(', ')}`)
	logger.info('Exiting due to missing environment secrets')
	process.exit(1)
}

logger.info('All environment secrets are set')

export { }
