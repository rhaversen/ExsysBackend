import { expect } from 'chai'
import { describe, it } from 'mocha'

describe('Development Setup', function () {
	before(function () {
		// Setting up environment variables for testing
		process.env.SUMUP_API_KEY = 'DUMMY_SUMUP_API_KEY'
		process.env.SUMUP_MERCHANT_CODE = 'DUMMY_SUMUP_MERCHANT_CODE'
	})

	after(function () {
		// Close dev app
		setTimeout(() => {
			// eslint-disable-next-line n/no-process-exit
			process.exit()
		}, 5000)
	})

	// Test to check if the development environment can be started
	it('should start the development environment', async function () {
		this.timeout(20000)
		let errorOccurred = false
		try {
			// Importing and starting the app
			await import('../../development/index.js')
			// Closing the app
			const app = await import('../../app/index.js')
			await app.shutDown()
		} catch {
			errorOccurred = true
		}
		// Check if the app started without errors
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.false
	})
})
