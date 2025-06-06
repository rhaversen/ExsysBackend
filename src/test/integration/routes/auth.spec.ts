/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { randomUUID } from 'crypto' // Add this import

import { expect } from 'chai'
import mongoose from 'mongoose'
import sinon from 'sinon'

import { getOrCreateConfigs } from '../../../app/controllers/configsController.js'
import AdminModel, { type IAdmin } from '../../../app/models/Admin.js'
import KioskModel, { type IKiosk } from '../../../app/models/Kiosk.js'
import ReaderModel from '../../../app/models/Reader.js'
import SessionModel from '../../../app/models/Session.js' // Add this import
import config from '../../../app/utils/setupConfig.js'
import { getChaiAgent as agent, extractConnectSid } from '../../testSetup.js'

// Config
const {
	sessionExpiry
} = config

describe('Auth routes', function () {
	describe('POST /v1/auth/login-admin-local', function () {
		let testAdmin: IAdmin

		const testAdminFields = {
			name: 'TestAdmin',
			password: 'testPassword'
		}

		beforeEach(async function () {
			testAdmin = new AdminModel(testAdminFields)
			await testAdmin.save()
		})

		it('should have status 200 with valid credentials', async function () {
			// Log the admin in to get a token
			const res = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			expect(res).to.have.status(200)
		})

		it('should return a session cookie', async function () {
			// Log the admin in to get a token
			const res = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			const cookie = extractConnectSid(res.headers['set-cookie'])
			expect(cookie).to.be.a('string')
			expect(cookie).to.include('connect.sid=')
		})

		it('should create a session in the database', async function () {
			// Create a session in the database
			await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			const sessionCollection = mongoose.connection.collection('sessions')
			const session = await sessionCollection.findOne({})

			expect(session).to.be.an('object')
		})

		it('should set the session id to the same as the cookie', async function () {
			// Log the admin in to get a token
			const res = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			const cookie = extractConnectSid(res.headers['set-cookie'])
			const encodedCookieValue = cookie.split('=')[1]
			const signedAndEncodedSessionId = encodedCookieValue.split('.')[0] as string
			const cookieSessionId = decodeURIComponent(signedAndEncodedSessionId).substring(2)

			const sessionCollection = mongoose.connection.collection('sessions')
			const session = await sessionCollection.findOne({})

			expect(session?._id).to.equal(cookieSessionId)
		})

		it('should set the session user to the admin id', async function () {
			// Log the admin in to get a token
			await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			const sessionCollection = mongoose.connection.collection('sessions')
			const session = await sessionCollection.findOne({})

			const sessionData = JSON.parse(session?.session as string)
			const sessionAdminId = sessionData.passport.user

			expect(sessionAdminId).to.equal(testAdmin.id)
		})

		it('should set originalMaxAge to null in the session', async function () {
			// Log the admin in to get a token
			await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			const sessionCollection = mongoose.connection.collection('sessions')
			const session = await sessionCollection.findOne({})

			const sessionData = JSON.parse(session?.session as string)
			const sessionCookie = sessionData.cookie

			expect(sessionCookie.originalMaxAge).to.equal(null)
		})

		it('should set the session cookie to HttpOnly', async function () {
			// Log the admin in to get a token
			const res = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			const cookie = extractConnectSid(res.headers['set-cookie'], true)
			expect(cookie).to.include('HttpOnly')
		})

		it('should set the Path on the session cookie', async function () {
			// Log the admin in to get a token
			const res = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			const cookie = extractConnectSid(res.headers['set-cookie'], true)
			expect(cookie).to.include('Path=/')
		})

		it('should not set the maxAge on the session cookie', async function () {
			// Log the admin in to get a token
			const res = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			const cookie = extractConnectSid(res.headers['set-cookie'], true)
			expect(cookie).to.not.include('Max-Age')
		})

		it('should return 401 with invalid password', async function () {
			const res = await agent().post('/api/v1/auth/login-admin-local').send({
				name: testAdminFields.name,
				password: 'invalidPassword'
			})

			expect(res).to.have.status(401)
		})

		it('should return 401 with invalid name', async function () {
			const res = await agent().post('/api/v1/auth/login-admin-local').send({
				name: 'invalidName',
				password: testAdminFields.password
			})

			expect(res).to.have.status(401)
		})

		it('should return 400 with missing name', async function () {
			const res = await agent().post('/api/v1/auth/login-admin-local').send({
				password: testAdminFields.password
			})

			expect(res).to.have.status(400)
		})

		it('should return 400 with missing password', async function () {
			const res = await agent().post('/api/v1/auth/login-admin-local').send({
				name: testAdminFields.name
			})

			expect(res).to.have.status(400)
		})

		it('should return 400 with missing name and password', async function () {
			const res = await agent().post('/api/v1/auth/login-admin-local').send({})

			expect(res).to.have.status(400)
		})
	})

	describe('POST /v1/auth/login-admin-local with stayLoggedIn', function () {
		const testAdminFields = {
			name: 'TestAdmin',
			password: 'testPassword',
			stayLoggedIn: 'true'
		}

		beforeEach(async function () {
			const testAdmin = new AdminModel(testAdminFields)
			await testAdmin.save()
		})

		it('should set a Expires on the session cookie when stayLoggedIn is true', async function () {
			const res = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			expect(res).to.have.status(200)

			const cookie = extractConnectSid(res.headers['set-cookie'], true)
			expect(cookie).to.include('Expires')
		})

		it('should set the Expires to the sessionExpiry value + now time', async function () {
			// Fake time with sinon
			sinon.useFakeTimers(new Date('2024-01-01'))

			const res = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			expect(res).to.have.status(200)

			const cookie = extractConnectSid(res.headers['set-cookie'], true)
			const expiryDate = new Date(Date.now() + sessionExpiry)
			expect(cookie).to.include(`Expires=${expiryDate.toUTCString()}`)
		})

		it('should not set a longer Expires on the session cookie when stayLoggedIn is not true', async function () {
			const res = await agent().post('/api/v1/auth/login-admin-local').send({
				...testAdminFields,
				stayLoggedIn: 'false'
			})

			expect(res).to.have.status(200)
			const setCookieHeader = res.headers['set-cookie']
			const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
			expect(cookies).to.be.an('array').that.satisfies((cookies: string[]) => {
				return cookies.every((cookie: string) => !cookie.includes('Expires'))
			})
		})

		it('should set the expiry in the session data', async function () {
			// Log the admin in to get a token
			const res = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			expect(res).to.have.status(200)

			const sessionCollection = mongoose.connection.collection('sessions')
			const session = await sessionCollection.findOne({})

			const sessionData = JSON.parse(session?.session as string)
			const sessionCookie = sessionData.cookie

			expect(sessionCookie.originalMaxAge).to.be.closeTo(sessionExpiry, 1000)
		})

		it('should handle boolean stayLoggedIn values', async function () {
			// Log the admin in to get a token
			const res = await agent().post('/api/v1/auth/login-admin-local').send({
				...testAdminFields,
				stayLoggedIn: true
			})

			expect(res).to.have.status(200)

			const sessionCollection = mongoose.connection.collection('sessions')
			const session = await sessionCollection.findOne({})

			const sessionData = JSON.parse(session?.session as string)
			const sessionCookie = sessionData.cookie

			expect(sessionCookie.originalMaxAge).to.be.closeTo(sessionExpiry, 1000)
		})
	})

	describe('POST /v1/auth/login-kiosk-local', function () {
		let testKiosk: IKiosk

		const testKioskFields = {
			name: 'TestKiosk',
			kioskTag: '12345',
			password: 'Password'
		}

		beforeEach(async function () {
			const testReader = await ReaderModel.create({
				apiReferenceId: 'test',
				readerTag: '12345'
			})
			testKiosk = new KioskModel({
				...testKioskFields,
				readerId: testReader.id
			})
			await testKiosk.save()
			// Set the global kiosk password for the test
			const configs = await getOrCreateConfigs()
			configs.kioskPassword = testKioskFields.password
			await configs.save()
		})

		it('should have status 200 with valid credentials', async function () {
			// Log the kiosk in to get a token
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			expect(res).to.have.status(200)
		})

		it('should return a session cookie', async function () {
			// Log the kiosk in to get a token
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			const cookie = extractConnectSid(res.headers['set-cookie'])
			expect(cookie).to.be.a('string')
			expect(cookie).to.include('connect.sid=')
		})

		it('should create a session in the database', async function () {
			// Create a session in the database
			await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			const sessionCollection = mongoose.connection.collection('sessions')
			const session = await sessionCollection.findOne({})

			expect(session).to.be.an('object')
		})

		it('should set the session id to the same as the cookie', async function () {
			// Log the kiosk in to get a token
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			const cookie = extractConnectSid(res.headers['set-cookie'])
			const encodedCookieValue = cookie.split('=')[1]
			const signedAndEncodedSessionId = encodedCookieValue.split('.')[0] as string
			const cookieSessionId = decodeURIComponent(signedAndEncodedSessionId).substring(2)

			const sessionCollection = mongoose.connection.collection('sessions')
			const session = await sessionCollection.findOne({})

			expect(session?._id).to.equal(cookieSessionId)
		})

		it('should set the session user to the kiosk id', async function () {
			// Log the kiosk in to get a token
			await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			const sessionCollection = mongoose.connection.collection('sessions')
			const session = await sessionCollection.findOne({})

			const sessionData = JSON.parse(session?.session as string)
			const sessionKioskId = sessionData.passport.user

			expect(sessionKioskId).to.equal(testKiosk.id)
		})

		it('should not set originalMaxAge to null in the session', async function () {
			// Log the kiosk in to get a token
			await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			const sessionCollection = mongoose.connection.collection('sessions')
			const session = await sessionCollection.findOne({})

			const sessionData = JSON.parse(session?.session as string)
			const sessionCookie = sessionData.cookie

			expect(sessionCookie.originalMaxAge).to.not.equal(null)
		})

		it('should set a Expires on the session cookie', async function () {
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			expect(res).to.have.status(200)

			const cookie = extractConnectSid(res.headers['set-cookie'], true)
			expect(cookie).to.include('Expires')
		})

		it('should set the Expires to the sessionExpiry value + now time', async function () {
			// Fake time with sinon
			sinon.useFakeTimers(new Date('2024-01-01'))

			const res = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			expect(res).to.have.status(200)

			const cookie = extractConnectSid(res.headers['set-cookie'], true)
			const expiryDate = new Date(Date.now() + sessionExpiry)
			expect(cookie).to.include(`Expires=${expiryDate.toUTCString()}`)
		})

		it('should set the session cookie to HttpOnly', async function () {
			// Log the kiosk in to get a token
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			const cookie = extractConnectSid(res.headers['set-cookie'], true)
			expect(cookie).to.include('HttpOnly')
		})

		it('should set the Path on the session cookie', async function () {
			// Log the kiosk in to get a token
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			const cookie = extractConnectSid(res.headers['set-cookie'], true)
			expect(cookie).to.include('Path=/')
		})

		it('should set the expiry in the session data', async function () {
			// Log the kiosk in to get a token
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			expect(res).to.have.status(200)

			const sessionCollection = mongoose.connection.collection('sessions')
			const session = await sessionCollection.findOne({})

			const sessionData = JSON.parse(session?.session as string)
			const sessionCookie = sessionData.cookie

			expect(sessionCookie.originalMaxAge).to.be.closeTo(sessionExpiry, 1000)
		})

		it('should return 401 with invalid password', async function () {
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send({
				kioskTag: testKioskFields.kioskTag,
				password: 'invalidPassword'
			})

			expect(res).to.have.status(401)
		})

		it('should return 401 with invalid kioskTag', async function () {
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send({
				kioskTag: '54321',
				password: testKioskFields.password
			})

			expect(res).to.have.status(401)
		})

		it('should return 400 with missing kioskTag', async function () {
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send({
				password: testKioskFields.password
			})

			expect(res).to.have.status(400)
		})

		it('should return 400 with missing password', async function () {
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send({
				kioskTag: testKioskFields.kioskTag
			})

			expect(res).to.have.status(400)
		})

		it('should return 400 with missing kioskTag and password', async function () {
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send({})

			expect(res).to.have.status(400)
		})

		it('should return 409 if the kiosk already has an active session', async function () {
			// Manually create an active session for the test kiosk
			await SessionModel.create({
				_id: randomUUID(),
				session: JSON.stringify({
					cookie: {
						originalMaxAge: 86400000, // Example value
						expires: new Date(Date.now() + 86400000), // Future expiry
						secure: true,
						httpOnly: true,
						path: '/'
					},
					passport: {
						user: testKiosk.id // Link session to the test kiosk
					},
					ipAddress: '127.0.0.1',
					loginTime: new Date(),
					lastActivity: new Date(),
					userAgent: 'test-agent',
					type: 'kiosk'
				}),
				expires: new Date(Date.now() + 86400000) // Ensure session is not expired
			})

			// Attempt login with the standard agent
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

			expect(res).to.have.status(409)
			expect(res.body.error).to.exist
		})

		it('should return 200 if override is true, even if the kiosk has an active session', async function () {
			// Manually create an active session for the test kiosk
			await SessionModel.create({
				_id: randomUUID(),
				session: JSON.stringify({
					cookie: {
						originalMaxAge: 86400000,
						expires: new Date(Date.now() + 86400000),
						secure: true,
						httpOnly: true,
						path: '/'
					},
					passport: { user: testKiosk.id },
					ipAddress: '127.0.0.1',
					loginTime: new Date(),
					lastActivity: new Date(),
					userAgent: 'test-agent',
					type: 'kiosk'
				}),
				expires: new Date(Date.now() + 86400000)
			})

			// Attempt login with override
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send({ ...testKioskFields, override: true })

			expect(res).to.have.status(200)
		})

		it('should return 200 if override is string "true", even if the kiosk has an active session', async function () {
			// Manually create an active session for the test kiosk
			await SessionModel.create({
				_id: randomUUID(),
				session: JSON.stringify({
					cookie: {
						originalMaxAge: 86400000,
						expires: new Date(Date.now() + 86400000),
						secure: true,
						httpOnly: true,
						path: '/'
					},
					passport: { user: testKiosk.id },
					ipAddress: '127.0.0.1',
					loginTime: new Date(),
					lastActivity: new Date(),
					userAgent: 'test-agent',
					type: 'kiosk'
				}),
				expires: new Date(Date.now() + 86400000)
			})

			// Attempt login with override as string
			const res = await agent().post('/api/v1/auth/login-kiosk-local').send({ ...testKioskFields, override: 'true' })

			expect(res).to.have.status(200)
		})
	})

	describe('POST /v1/auth/logout-local', function () {
		describe('with Admin', function () {
			let testAdmin: IAdmin

			const testAdminFields = {
				name: 'TestAdmin',
				password: 'testPassword'
			}

			beforeEach(async function () {
				testAdmin = new AdminModel(testAdminFields)
				await testAdmin.save()
			})

			it('should have status 200', async function () {
				// Log the admin in to get a token
				await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

				// Log the admin out to remove the session
				const res = await agent().post('/api/v1/auth/logout-local')

				expect(res).to.have.status(200)
			})

			/**
			it('should remove the passport.user from the session JSON in the database', async function () {
				const sessionCollection = mongoose.connection.collection('sessions')

				const loginRes = await agent().post('/api/v1/auth/login-Admin-local').send(testAdminFields)
				const sessionCookie = loginRes.headers['set-cookie'] as string

				// Log the admin out to remove the session
				const res = await agent().post('/api/v1/auth/logout-local').set('Cookie', sessionCookie)

				const session = await sessionCollection.findOne({})
				const sessionData = JSON.parse(session?.session as string)

				expect(sessionData.passport.user).to.not.exist
			})
			 */

			it('should remove the session cookie', async function () {
				// Log the admin in to get a token
				await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

				// Log the admin out to remove the session
				const res = await agent().post('/api/v1/auth/logout-local')

				// Check if the 'Set-Cookie' header is present and ensures the 'connect.sid' cookie is cleared
				const sidCookie = extractConnectSid(res.headers['set-cookie'], true)

				expect(sidCookie).to.exist
				expect(sidCookie).to.include('connect.sid=;')
				expect(sidCookie).to.include('Expires=')
			})
		})

		describe('with Kiosk', function () {
			let testKiosk: IKiosk

			const testKioskFields = {
				name: 'TestKiosk',
				kioskTag: '12345',
				password: 'Password'
			}

			beforeEach(async function () {
				const testReader = await ReaderModel.create({
					apiReferenceId: 'test',
					readerTag: '12345'
				})
				testKiosk = new KioskModel({
					...testKioskFields,
					readerId: testReader.id
				})
				await testKiosk.save()
				// Set the global kiosk password for the test
				const configs = await getOrCreateConfigs()
				configs.kioskPassword = testKioskFields.password
				await configs.save()
			})

			it('should have status 200', async function () {
				// Log the kiosk in to get a token
				const loginRes = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)
				const sessionCookie = extractConnectSid(loginRes.headers['set-cookie'])

				// Log the kiosk out to remove the session
				const res = await agent().post('/api/v1/auth/logout-local').set('Cookie', sessionCookie)

				expect(res).to.have.status(200)
			})

			/**
			it('should remove the passport.user from the session JSON in the database', async function () {
				const sessionCollection = mongoose.connection.collection('sessions')

				const loginRes = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)
				const sessionCookie = loginRes.headers['set-cookie'] as string

				// Log the kiosk out to remove the session
				const res = await agent().post('/api/v1/auth/logout-local').set('Cookie', sessionCookie)

				const session = await sessionCollection.findOne({})
				const sessionData = JSON.parse(session?.session as string)

				expect(sessionData.passport.user).to.not.exist
			})
			 */

			it('should remove the session cookie', async function () {
				const loginRes = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)
				const sessionCookie = extractConnectSid(loginRes.headers['set-cookie'])

				// Log the kiosk out to remove the session
				const res = await agent().post('/api/v1/auth/logout-local').set('Cookie', sessionCookie)

				// Check if the 'Set-Cookie' header is present and ensures the 'connect.sid' cookie is cleared
				const sidCookie = extractConnectSid(res.headers['set-cookie'], true)

				expect(sidCookie).to.exist
				expect(sidCookie).to.include('connect.sid=;')
				expect(sidCookie).to.include('Expires=')
			})
		})
	})

	describe('GET /v1/auth/is-authenticated', function () {
		describe('with Admin', function () {
			let testAdmin: IAdmin

			const testAdminFields = {
				name: 'TestAdmin',
				password: 'testPassword'
			}

			beforeEach(async function () {
				testAdmin = new AdminModel(testAdminFields)
				await testAdmin.save()
			})

			it('should return 200 with a valid session', async function () {
				// Log the admin in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Use the session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-authenticated').set('Cookie', sessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(200)
			})

			it('should return 401 without a valid session', async function () {
				// Send the request without a session cookie
				const res = await agent().get('/api/v1/auth/is-authenticated')

				// Validate the response
				expect(res).to.have.status(401)
			})

			it('should return 401 with an invalid session', async function () {
				// Send the request with an invalid session cookie
				const res = await agent().get('/api/v1/auth/is-authenticated').set('Cookie', 'connect.sid=invalidSession')

				// Validate the response
				expect(res).to.have.status(401)
			})

			it('should return 401 with a session that has been tampered with', async function () {
				// Log the admin in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Tamper with the session cookie
				const tamperedSessionCookie = sessionCookie.replace('connect.sid', 'tamperedSession')

				// Use the tampered session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-authenticated').set('Cookie', tamperedSessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(401)
			})
		})

		describe('with Kiosk', function () {
			let testKiosk: IKiosk

			const testKioskFields = {
				name: 'TestKiosk',
				kioskTag: '12345',
				password: 'Password'
			}

			beforeEach(async function () {
				const testReader = await ReaderModel.create({
					apiReferenceId: 'test',
					readerTag: '12345'
				})
				testKiosk = new KioskModel({
					...testKioskFields,
					readerId: testReader.id
				})
				await testKiosk.save()
				// Set the global kiosk password for the test
				const configs = await getOrCreateConfigs()
				configs.kioskPassword = testKioskFields.password
				await configs.save()
			})

			it('should return 200 with a valid session', async function () {
				// Log the kiosk in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Use the session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-authenticated').set('Cookie', sessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(200)
			})

			it('should return 401 without a valid session', async function () {
				// Send the request without a session cookie
				const res = await agent().get('/api/v1/auth/is-authenticated')

				// Validate the response
				expect(res).to.have.status(401)
			})

			it('should return 401 with an invalid session', async function () {
				// Send the request with an invalid session cookie
				const res = await agent().get('/api/v1/auth/is-authenticated').set('Cookie', 'connect.sid=invalidSession')

				// Validate the response
				expect(res).to.have.status(401)
			})

			it('should return 401 with a session that has been tampered with', async function () {
				// Log the kiosk in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Tamper with the session cookie
				const tamperedSessionCookie = sessionCookie.replace('connect.sid', 'tamperedSession')

				// Use the tampered session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-authenticated').set('Cookie', tamperedSessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(401)
			})
		})
	})

	describe('GET /v1/auth/is-authenticated with stayLoggedIn', function () {
		let testAdmin: IAdmin

		const testAdminFields = {
			name: 'TestAdmin',
			password: 'testPassword',
			stayLoggedIn: true
		}

		beforeEach(async function () {
			testAdmin = new AdminModel(testAdminFields)
			await testAdmin.save()
		})

		it('should return 200 with a valid session', async function () {
			// Log the admin in to get a session cookie
			const loginRes = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			// Extract the session cookie directly
			const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

			// Use the session cookie in the authenticated request
			const res = await agent().get('/api/v1/auth/is-authenticated').set('Cookie', sessionCookie)

			// Validate the authenticated response
			expect(res).to.have.status(200)
		})

		it('should return 401 without a valid session', async function () {
			// Send the request without a session cookie
			const res = await agent().get('/api/v1/auth/is-authenticated')

			// Validate the response
			expect(res).to.have.status(401)
		})

		it('should return 401 with an invalid session', async function () {
			// Send the request with an invalid session cookie
			const res = await agent().get('/api/v1/auth/is-authenticated').set('Cookie', 'connect.sid=invalidSession')

			// Validate the response
			expect(res).to.have.status(401)
		})

		it('should return 401 with a session that has been tampered with', async function () {
			// Log the admin in to get a session cookie
			const loginRes = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			// Extract the session cookie directly
			const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

			// Tamper with the session cookie
			const tamperedSessionCookie = sessionCookie.replace('connect.sid', 'tamperedSession')

			// Use the tampered session cookie in the authenticated request
			const res = await agent().get('/api/v1/auth/is-authenticated').set('Cookie', tamperedSessionCookie)

			// Validate the authenticated response
			expect(res).to.have.status(401)
		})

		it('should return 401 with an expired session', async function () {
			// Fake time with sinon
			const clock = sinon.useFakeTimers(new Date('2024-01-01'))

			// Log the admin in to get a session cookie
			const loginRes = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

			// Move the clock past the session expiry
			clock.tick(sessionExpiry + 1000)

			// Extract the session cookie directly
			const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

			// Use the session cookie in the authenticated request
			const res = await agent().get('/api/v1/auth/is-authenticated').set('Cookie', sessionCookie)

			// Validate the authenticated response
			expect(res).to.have.status(401)
		})
	})

	describe('GET /v1/auth/is-admin', function () {
		describe('with Admin', function () {
			let testAdmin: IAdmin

			const testAdminFields = {
				name: 'TestAdmin',
				password: 'testPassword'
			}

			beforeEach(async function () {
				testAdmin = new AdminModel(testAdminFields)
				await testAdmin.save()
			})

			it('should return 200 with a valid session', async function () {
				// Log the admin in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Use the session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-admin').set('Cookie', sessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(200)
			})

			it('should return 403 without a valid session', async function () {
				// Send the request without a session cookie
				const res = await agent().get('/api/v1/auth/is-admin')

				// Validate the response
				expect(res).to.have.status(403)
			})

			it('should return 403 with an invalid session', async function () {
				// Send the request with an invalid session cookie
				const res = await agent().get('/api/v1/auth/is-admin').set('Cookie', 'connect.sid=invalidSession')

				// Validate the response
				expect(res).to.have.status(403)
			})

			it('should return 403 with a session that has been tampered with', async function () {
				// Log the admin in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Tamper with the session cookie
				const tamperedSessionCookie = sessionCookie.replace('connect.sid', 'tamperedSession')

				// Use the tampered session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-admin').set('Cookie', tamperedSessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(403)
			})
		})

		describe('with Kiosk', function () {
			let testKiosk: IKiosk

			const testKioskFields = {
				name: 'TestKiosk',
				kioskTag: '12345',
				password: 'Password'
			}

			beforeEach(async function () {
				const testReader = await ReaderModel.create({
					apiReferenceId: 'test',
					readerTag: '12345'
				})
				testKiosk = new KioskModel({
					...testKioskFields,
					readerId: testReader.id
				})
				await testKiosk.save()
				// Set the global kiosk password for the test
				const configs = await getOrCreateConfigs()
				configs.kioskPassword = testKioskFields.password
				await configs.save()
			})

			it('should return 403 with a valid session', async function () {
				// Log the kiosk in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Use the session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-admin').set('Cookie', sessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(403)
			})

			it('should return 403 without a valid session', async function () {
				// Send the request without a session cookie
				const res = await agent().get('/api/v1/auth/is-admin')

				// Validate the response
				expect(res).to.have.status(403)
			})

			it('should return 403 with an invalid session', async function () {
				// Send the request with an invalid session cookie
				const res = await agent().get('/api/v1/auth/is-admin').set('Cookie', 'connect.sid=invalidSession')

				// Validate the response
				expect(res).to.have.status(403)
			})

			it('should return 403 with a session that has been tampered with', async function () {
				// Log the kiosk in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Tamper with the session cookie
				const tamperedSessionCookie = sessionCookie.replace('connect.sid', 'tamperedSession')

				// Use the tampered session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-admin').set('Cookie', tamperedSessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(403)
			})
		})
	})

	describe('GET /v1/auth/is-kiosk', function () {
		describe('with Admin', function () {
			let testAdmin: IAdmin

			const testAdminFields = {
				name: 'TestAdmin',
				password: 'testPassword'
			}

			beforeEach(async function () {
				testAdmin = new AdminModel(testAdminFields)
				await testAdmin.save()
			})

			it('should return 403 with a valid session', async function () {
				// Log the admin in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Use the session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-kiosk').set('Cookie', sessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(403)
			})

			it('should return 403 without a valid session', async function () {
				// Send the request without a session cookie
				const res = await agent().get('/api/v1/auth/is-kiosk')

				// Validate the response
				expect(res).to.have.status(403)
			})

			it('should return 403 with an invalid session', async function () {
				// Send the request with an invalid session cookie
				const res = await agent().get('/api/v1/auth/is-kiosk').set('Cookie', 'connect.sid=invalidSession')

				// Validate the response
				expect(res).to.have.status(403)
			})

			it('should return 403 with a session that has been tampered with', async function () {
				// Log the admin in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-admin-local').send(testAdminFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Tamper with the session cookie
				const tamperedSessionCookie = sessionCookie.replace('connect.sid', 'tamperedSession')

				// Use the tampered session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-kiosk').set('Cookie', tamperedSessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(403)
			})
		})

		describe('with Kiosk', function () {
			let testKiosk: IKiosk

			const testKioskFields = {
				name: 'TestKiosk',
				kioskTag: '12345',
				password: 'Password'
			}

			beforeEach(async function () {
				const testReader = await ReaderModel.create({
					apiReferenceId: 'test',
					readerTag: '12345'
				})
				testKiosk = new KioskModel({
					...testKioskFields,
					readerId: testReader.id
				})
				await testKiosk.save()
				// Set the global kiosk password for the test
				const configs = await getOrCreateConfigs()
				configs.kioskPassword = testKioskFields.password
				await configs.save()
			})

			it('should return 200 with a valid session', async function () {
				// Log the kiosk in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Use the session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-kiosk').set('Cookie', sessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(200)
			})

			it('should return 403 without a valid session', async function () {
				// Send the request without a session cookie
				const res = await agent().get('/api/v1/auth/is-kiosk')

				// Validate the response
				expect(res).to.have.status(403)
			})

			it('should return 403 with an invalid session', async function () {
				// Send the request with an invalid session cookie
				const res = await agent().get('/api/v1/auth/is-kiosk').set('Cookie', 'connect.sid=invalidSession')

				// Validate the response
				expect(res).to.have.status(403)
			})

			it('should return 403 with a session that has been tampered with', async function () {
				// Log the kiosk in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Tamper with the session cookie
				const tamperedSessionCookie = sessionCookie.replace('connect.sid', 'tamperedSession')

				// Use the tampered session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-kiosk').set('Cookie', tamperedSessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(403)
			})

			it('should return 403 with an expired session', async function () {
				// Fake time with sinon
				const clock = sinon.useFakeTimers(new Date('2024-01-01'))

				// Log the kiosk in to get a session cookie
				const loginRes = await agent().post('/api/v1/auth/login-kiosk-local').send(testKioskFields)

				// Move the clock past the session expiry
				clock.tick(sessionExpiry + 1000)

				// Extract the session cookie directly
				const sessionCookie: string = extractConnectSid(loginRes.headers['set-cookie'])

				// Use the session cookie in the authenticated request
				const res = await agent().get('/api/v1/auth/is-kiosk').set('Cookie', sessionCookie)

				// Validate the authenticated response
				expect(res).to.have.status(403)
			})
		})
	})
})
