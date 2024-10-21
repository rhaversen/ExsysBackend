// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Process environment variables
process.env.NODE_ENV = 'development'
process.env.SESSION_SECRET = 'TEST_SESSION_SECRET'

async function startServer (): Promise<void> {
	try {
		const connectToMongoDB = await import('../test/mongoMemoryReplSetConnector.js')
		// Connect to the MongoDB
		await connectToMongoDB.default()

		// Seed the database (if necessary)
		await import('./seedDatabase.js')

		// Start the application server
		await import('../app/index.js')
	} catch (error) {
		console.error('Failed to start the server:', error)
	}
}

// Execute the server startup sequence
await startServer()

export {}
