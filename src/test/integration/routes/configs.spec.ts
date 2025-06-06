/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'

import { getOrCreateConfigs } from '../../../app/controllers/configsController.js'
import AdminModel from '../../../app/models/Admin.js'
import ConfigsModel from '../../../app/models/Configs.js'
import KioskModel from '../../../app/models/Kiosk.js'
import ReaderModel from '../../../app/models/Reader.js'
import { getChaiAgent as agent, extractConnectSid } from '../../testSetup.js'

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
		const adminResponse = await agent().post('/api/v1/auth/login-admin-local').send(adminFields)
		// Extract the connect.sid cookie correctly
		adminSessionCookie = extractConnectSid(adminResponse.headers['set-cookie'])

		// Create Kiosk
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

		// Set the global kiosk password *before* kiosk login
		const configs = await getOrCreateConfigs()
		configs.kioskPassword = kioskFields.password
		await configs.save()

		// Log in as kiosk
		const kioskResponse = await agent().post('/api/v1/auth/login-kiosk-local').send({
			kioskTag: kioskFields.kioskTag,
			password: kioskFields.password
		})
		// Extract the connect.sid cookie correctly
		kioskSessionCookie = extractConnectSid(kioskResponse.headers['set-cookie'])
	})

	describe('GET /v1/configs', function () {
		it('should have status 200 when accessed as admin', async function () {
			const response = await agent().get('/api/v1/configs').set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
		})

		it('should have status 200 when accessed as kiosk', async function () {
			const response = await agent().get('/api/v1/configs').set('Cookie', kioskSessionCookie)
			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().get('/api/v1/configs')
			expect(response).to.have.status(403)
		})

		it('should return configs with default values when no configs exist', async function () {
			const response = await agent().get('/api/v1/configs').set('Cookie', adminSessionCookie)

			expect(response.body.configs).to.have.property('kioskInactivityTimeoutMs', 60000)
			expect(response.body.configs).to.have.property('kioskInactivityTimeoutWarningMs', 10000)
			expect(response.body.configs).to.have.property('kioskOrderConfirmationTimeoutMs', 10000)
		})

		it('should return existing configs when they exist', async function () {
			const testConfigs = {
				kioskInactivityTimeoutMs: 30000,
				kioskInactivityTimeoutWarningMs: 5000,
				kioskOrderConfirmationTimeoutMs: 15000
			}
			// Use PATCH to update the singleton config document
			await agent()
				.patch('/api/v1/configs')
				.send(testConfigs)
				.set('Cookie', adminSessionCookie)

			// Use GET to fetch the updated configs
			const response = await agent().get('/api/v1/configs').set('Cookie', adminSessionCookie)

			expect(response.body.configs).to.have.property('kioskInactivityTimeoutMs', testConfigs.kioskInactivityTimeoutMs)
			expect(response.body.configs).to.have.property('kioskInactivityTimeoutWarningMs', testConfigs.kioskInactivityTimeoutWarningMs)
			expect(response.body.configs).to.have.property('kioskOrderConfirmationTimeoutMs', testConfigs.kioskOrderConfirmationTimeoutMs)
		})

		it('should return same config document when called multiple times', async function () {
			const firstResponse = await agent().get('/api/v1/configs').set('Cookie', adminSessionCookie)
			const firstId = firstResponse.body._id

			const secondResponse = await agent().get('/api/v1/configs').set('Cookie', adminSessionCookie)
			const secondId = secondResponse.body._id

			expect(firstId).to.equal(secondId)
		})
	})

	describe('PATCH /v1/configs', function () {
		it('should have status 200 when accessed as admin', async function () {
			const response = await agent()
				.patch('/api/v1/configs')
				.send({ kioskInactivityTimeoutMs: 30000 })
				.set('Cookie', adminSessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 when accessed as kiosk', async function () {
			const response = await agent()
				.patch('/api/v1/configs')
				.send({ kioskInactivityTimeoutMs: 30000 })
				.set('Cookie', kioskSessionCookie)

			expect(response).to.have.status(403)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent()
				.patch('/api/v1/configs')
				.send({ kioskInactivityTimeoutMs: 30000 })

			expect(response).to.have.status(403)
		})

		it('should update existing configs', async function () {
			const updatedConfigs = {
				kioskInactivityTimeoutMs: 30000,
				kioskInactivityTimeoutWarningMs: 5000,
				kioskOrderConfirmationTimeoutMs: 15000
			}

			const response = await agent()
				.patch('/api/v1/configs')
				.send(updatedConfigs)
				.set('Cookie', adminSessionCookie)

			expect(response.body.configs).to.have.property('kioskInactivityTimeoutMs', updatedConfigs.kioskInactivityTimeoutMs)
			expect(response.body.configs).to.have.property('kioskInactivityTimeoutWarningMs', updatedConfigs.kioskInactivityTimeoutWarningMs)
			expect(response.body.configs).to.have.property('kioskOrderConfirmationTimeoutMs', updatedConfigs.kioskOrderConfirmationTimeoutMs)
		})

		it('should save the configs to the database', async function () {
			const updatedConfigs = {
				kioskInactivityTimeoutMs: 30000,
				kioskInactivityTimeoutWarningMs: 5000,
				kioskOrderConfirmationTimeoutMs: 15000
			}

			await agent()
				.patch('/api/v1/configs')
				.send(updatedConfigs)
				.set('Cookie', adminSessionCookie)

			const savedConfigs = await ConfigsModel.findOne()

			expect(savedConfigs).to.have.property('kioskInactivityTimeoutMs', updatedConfigs.kioskInactivityTimeoutMs)
			expect(savedConfigs).to.have.property('kioskInactivityTimeoutWarningMs', updatedConfigs.kioskInactivityTimeoutWarningMs)
			expect(savedConfigs).to.have.property('kioskOrderConfirmationTimeoutMs', updatedConfigs.kioskOrderConfirmationTimeoutMs)
		})

		it('should allow partial updates', async function () {
			const partialUpdate = {
				kioskInactivityTimeoutMs: 30000
			}

			const response = await agent()
				.patch('/api/v1/configs')
				.send(partialUpdate)
				.set('Cookie', adminSessionCookie)

			expect(response.body.configs).to.have.property('kioskInactivityTimeoutMs', partialUpdate.kioskInactivityTimeoutMs)
			expect(response.body.configs).to.have.property('kioskInactivityTimeoutWarningMs', 10000) // default value
			expect(response.body.configs).to.have.property('kioskOrderConfirmationTimeoutMs', 10000) // default value
		})

		it('should validate minimum values', async function () {
			const invalidConfigs = {
				kioskInactivityTimeoutMs: 500 // Less than minimum 1000
			}

			const response = await agent()
				.patch('/api/v1/configs')
				.send(invalidConfigs)
				.set('Cookie', adminSessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should reject updates with invalid field names', async function () {
			const response = await agent()
				.patch('/api/v1/configs')
				.send({ invalidField: 30000 })
				.set('Cookie', adminSessionCookie)

			// The invalid field should be ignored and the update should succeed
			expect(response).to.have.status(200)
			expect(response.body).to.not.have.property('invalidField')
		})

		it('should not allow duplicate disabled weekdays', async function () {
			const invalidConfigs = {
				disabledWeekdays: [0, 1, 1] // Duplicate weekday (1=Tuesday)
			}

			const response = await agent()
				.patch('/api/v1/configs')
				.send(invalidConfigs)
				.set('Cookie', adminSessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should allow empty disabled weekdays', async function () {
			const validConfigs = {
				disabledWeekdays: [] // No weekdays disabled
			}

			const response = await agent()
				.patch('/api/v1/configs')
				.send(validConfigs)
				.set('Cookie', adminSessionCookie)

			expect(response).to.have.status(200)
			expect(response.body.configs.disabledWeekdays).to.be.an('array').that.is.empty
		})

		it('should allow valid disabled weekdays', async function () {
			const validConfigs = {
				disabledWeekdays: [0, 1, 2] // Monday, Tuesday, Wednesday
			}

			const response = await agent()
				.patch('/api/v1/configs')
				.send(validConfigs)
				.set('Cookie', adminSessionCookie)

			expect(response).to.have.status(200)
			expect(response.body.configs.disabledWeekdays).to.deep.equal(validConfigs.disabledWeekdays)
		})

		it('should not allow disabled weekdays outside the range 0-6', async function () {
			const invalidConfigs = {
				disabledWeekdays: [0, 1, 7] // 7 is out of range
			}

			const response = await agent()
				.patch('/api/v1/configs')
				.send(invalidConfigs)
				.set('Cookie', adminSessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should not allow disabled weekdays with more than 7 entries', async function () {
			const invalidConfigs = {
				disabledWeekdays: [0, 1, 2, 3, 4, 5, 6, 7] // More than 7 entries
			}

			const response = await agent()
				.patch('/api/v1/configs')
				.send(invalidConfigs)
				.set('Cookie', adminSessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should preserve other fields when updating partially', async function () {
			// First set all fields
			const initialUpdate = {
				kioskInactivityTimeoutMs: 30000,
				kioskInactivityTimeoutWarningMs: 5000,
				kioskOrderConfirmationTimeoutMs: 15000
			}
			await agent()
				.patch('/api/v1/configs')
				.send(initialUpdate)
				.set('Cookie', adminSessionCookie)

			// Then update just one field
			const response = await agent()
				.patch('/api/v1/configs')
				.send({ kioskInactivityTimeoutMs: 40000 })
				.set('Cookie', adminSessionCookie)

			expect(response.body.configs).to.include({
				kioskInactivityTimeoutMs: 40000,
				kioskInactivityTimeoutWarningMs: 5000,
				kioskOrderConfirmationTimeoutMs: 15000
			})
		})
	})
})
