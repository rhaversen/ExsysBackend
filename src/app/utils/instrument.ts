// Node.js built-in modules

// Third-party libraries
import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

// Own modules

// Environment variables

// Config variables

// Destructuring and global variables

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	environment: process.env.NODE_ENV,
	integrations: [
		nodeProfilingIntegration()
	],
	// Tracing
	tracesSampleRate: 1.0, //  Capture 100% of the transactions

	// Set sampling rate for profiling - this is relative to tracesSampleRate
	profilesSampleRate: 1.0
})
