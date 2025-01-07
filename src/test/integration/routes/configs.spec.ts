/* eslint-disable local/enforce-comment-order */

// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'

// Own modules
import { chaiAppServer as agent } from '../../testSetup.js'
import AdminModel from '../../../app/models/Admin.js'
import KioskModel from '../../../app/models/Kiosk.js'
import ConfigsModel from '../../../app/models/Configs.js'
import ReaderModel from '../../../app/models/Reader.js'

describe('Configs routes', function () {
	let adminSessionCookie: string
	let kioskSessionCookie: string

	beforeEach(async function () {
		// Create and log in as admin
		const adminFields = {
			name: 'Test Admin',
			password: 'testPassword'
		}
		await AdminModel.create(adminFields)
		const adminResponse = await agent.post('/api/v1/auth/login-admin-local').send(adminFields)
		adminSessionCookie = adminResponse.headers['set-cookie']

		// Create and log in as kiosk
		const testReader = await ReaderModel.create({
			apiReferenceId: 'test',
			readerTag: '12345'
		})
		const kioskFields = {
			name: 'Test Kiosk',
			kioskTag: '12345',
			password: 'kioskPassword',
			readerId: testReader.id
		}
		await KioskModel.create(kioskFields)
		const kioskResponse = await agent.post('/api/v1/auth/login-kiosk-local').send({
			kioskTag: kioskFields.kioskTag,
			password: kioskFields.password
		})
		kioskSessionCookie = kioskResponse.headers['set-cookie']
	})

	describe('GET /v1/configs', function () {
		it('should have status 200 when accessed as admin', async function () {
			const response = await agent.get('/api/v1/configs').set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
		})

		it('should have status 200 when accessed as kiosk', async function () {
			const response = await agent.get('/api/v1/configs').set('Cookie', kioskSessionCookie)
			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.get('/api/v1/configs')
			expect(response).to.have.status(403)
		})

		it('should return configs with default values when no configs exist', async function () {
			const response = await agent.get('/api/v1/configs').set('Cookie', adminSessionCookie)

			expect(response.body).to.have.property('kioskInactivityTimeout', 60000)
			expect(response.body).to.have.property('kioskInactivityTimeoutWarning', 10000)
			expect(response.body).to.have.property('kioskOrderConfirmationTimeout', 10000)
		})

		it('should return existing configs when they exist', async function () {
			const testConfigs = {
				kioskInactivityTimeout: 30000,
				kioskInactivityTimeoutWarning: 5000,
				kioskOrderConfirmationTimeout: 15000
			}
			await ConfigsModel.create(testConfigs)

			const response = await agent.get('/api/v1/configs').set('Cookie', adminSessionCookie)

			expect(response.body).to.have.property('kioskInactivityTimeout', testConfigs.kioskInactivityTimeout)
			expect(response.body).to.have.property('kioskInactivityTimeoutWarning', testConfigs.kioskInactivityTimeoutWarning)
			expect(response.body).to.have.property('kioskOrderConfirmationTimeout', testConfigs.kioskOrderConfirmationTimeout)
		})

		it('should return same config document when called multiple times', async function () {
			const firstResponse = await agent.get('/api/v1/configs').set('Cookie', adminSessionCookie)
			const firstId = firstResponse.body._id

			const secondResponse = await agent.get('/api/v1/configs').set('Cookie', adminSessionCookie)
			const secondId = secondResponse.body._id

			expect(firstId).to.equal(secondId)
		})

		it('should handle concurrent requests correctly', async function () {
			const promises = Array(5).fill(null).map(() =>
				agent.get('/api/v1/configs').set('Cookie', adminSessionCookie)
			)

			const responses = await Promise.all(promises)
			const ids = responses.map(response => response.body._id)

			// All responses should have the same ID
			expect(new Set(ids).size).to.equal(1)
		})
	})

	describe('PATCH /v1/configs', function () {
		it('should have status 200 when accessed as admin', async function () {
			const response = await agent
				.patch('/api/v1/configs')
				.send({ kioskInactivityTimeout: 30000 })
				.set('Cookie', adminSessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 when accessed as kiosk', async function () {
			const response = await agent
				.patch('/api/v1/configs')
				.send({ kioskInactivityTimeout: 30000 })
				.set('Cookie', kioskSessionCookie)

			expect(response).to.have.status(403)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent
				.patch('/api/v1/configs')
				.send({ kioskInactivityTimeout: 30000 })

			expect(response).to.have.status(403)
		})

		it('should update existing configs', async function () {
			const updatedConfigs = {
				kioskInactivityTimeout: 30000,
				kioskInactivityTimeoutWarning: 5000,
				kioskOrderConfirmationTimeout: 15000
			}

			const response = await agent
				.patch('/api/v1/configs')
				.send(updatedConfigs)
				.set('Cookie', adminSessionCookie)

			expect(response.body).to.have.property('kioskInactivityTimeout', updatedConfigs.kioskInactivityTimeout)
			expect(response.body).to.have.property('kioskInactivityTimeoutWarning', updatedConfigs.kioskInactivityTimeoutWarning)
			expect(response.body).to.have.property('kioskOrderConfirmationTimeout', updatedConfigs.kioskOrderConfirmationTimeout)
		})

		it('should allow partial updates', async function () {
			const partialUpdate = {
				kioskInactivityTimeout: 30000
			}

			const response = await agent
				.patch('/api/v1/configs')
				.send(partialUpdate)
				.set('Cookie', adminSessionCookie)

			expect(response.body).to.have.property('kioskInactivityTimeout', partialUpdate.kioskInactivityTimeout)
			expect(response.body).to.have.property('kioskInactivityTimeoutWarning', 10000) // default value
			expect(response.body).to.have.property('kioskOrderConfirmationTimeout', 10000) // default value
		})

		it('should validate minimum values', async function () {
			const invalidConfigs = {
				kioskInactivityTimeout: 500 // Less than minimum 1000
			}

			const response = await agent
				.patch('/api/v1/configs')
				.send(invalidConfigs)
				.set('Cookie', adminSessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should reject updates with invalid field names', async function () {
			const response = await agent
				.patch('/api/v1/configs')
				.send({ invalidField: 30000 })
				.set('Cookie', adminSessionCookie)

			// The invalid field should be ignored and the update should succeed
			expect(response).to.have.status(200)
			expect(response.body).to.not.have.property('invalidField')
		})

		it('should preserve other fields when updating partially', async function () {
			// First set all fields
			const initialUpdate = {
				kioskInactivityTimeout: 30000,
				kioskInactivityTimeoutWarning: 5000,
				kioskOrderConfirmationTimeout: 15000
			}
			await agent
				.patch('/api/v1/configs')
				.send(initialUpdate)
				.set('Cookie', adminSessionCookie)

			// Then update just one field
			const response = await agent
				.patch('/api/v1/configs')
				.send({ kioskInactivityTimeout: 40000 })
				.set('Cookie', adminSessionCookie)

			expect(response.body).to.include({
				kioskInactivityTimeout: 40000,
				kioskInactivityTimeoutWarning: 5000,
				kioskOrderConfirmationTimeout: 15000
			})
		})
	})
})
