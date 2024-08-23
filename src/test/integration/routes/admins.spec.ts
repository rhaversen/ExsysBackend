/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { chaiAppServer as agent } from '../../testSetup.js'
import mongoose from 'mongoose'

// Own modules
import AdminModel, { type IAdmin } from '../../../app/models/Admin.js'

describe('Admins routes', function () {
	let sessionCookie: string

	beforeEach(async function () {
		// Log the agent in to get a valid session
		const adminFields = {
			name: 'Agent Admin',
			password: 'agentPassword'
		}
		await AdminModel.create(adminFields)

		const response = await agent.post('/v1/auth/login-admin-local').send(adminFields)
		sessionCookie = response.headers['set-cookie']
	})

	describe('POST /v1/admins', function () {
		const testAdminFields1 = {
			name: 'admin1',
			password: 'password1'
		}

		it('should have status 201', async function () {
			const response = await agent.post('/v1/admins').send(testAdminFields1).set('Cookie', sessionCookie)

			expect(response).to.have.status(201)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.post('/v1/admins').send(testAdminFields1)

			expect(response).to.have.status(403)
		})

		it('should create a new admin', async function () {
			await agent.post('/v1/admins').send(testAdminFields1).set('Cookie', sessionCookie)

			const admin = await AdminModel.findOne({ name: testAdminFields1.name })
			expect(admin).to.exist
			expect(admin).to.have.property('name', testAdminFields1.name)
			expect(admin).to.have.property('password')
			expect(await admin?.comparePassword(testAdminFields1.password)).to.be.true
		})

		it('should return the newly created object', async function () {
			const response = await agent.post('/v1/admins').send(testAdminFields1).set('Cookie', sessionCookie)

			expect(response).to.have.status(201)
			expect(response.body).to.have.property('name', testAdminFields1.name)
		})

		it('should not return the password', async function () {
			const response = await agent.post('/v1/admins').send(testAdminFields1).set('Cookie', sessionCookie)

			expect(response.body).to.not.have.property('password')
		})

		it('should require a name', async function () {
			const response = await agent.post('/v1/admins').send({
				...testAdminFields1,
				name: undefined
			}).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
		})

		it('should not return the password', async function () {
			const response = await agent.post('/v1/admins').send(testAdminFields1).set('Cookie', sessionCookie)

			expect(response.body).to.not.have.property('password')
		})

		it('should not allow setting the _id', async function () {
			const newId = new mongoose.Types.ObjectId().toString()
			const updatedFields = {
				_id: newId
			}

			await agent.post('/v1/admins').send(updatedFields).set('Cookie', sessionCookie)
			const admin = await AdminModel.findOne({})
			expect(admin?.id.toString()).to.not.equal(newId)
		})
	})

	describe('GET /v1/admins', function () {
		const testAdminFields1 = {
			name: 'admin1',
			password: 'password1'
		}

		const testAdminFields2 = {
			name: 'admin2',
			password: 'password2'
		}

		beforeEach(async function () {
			await AdminModel.create(testAdminFields1)
			await AdminModel.create(testAdminFields2)
		})

		it('should have status 200', async function () {
			const response = await agent.get('/v1/admins').set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.get('/v1/admins')

			expect(response).to.have.status(403)
		})

		it('should return all admins', async function () {
			const response = await agent.get('/v1/admins').set('Cookie', sessionCookie)

			expect(response.body).to.be.an('array')
			expect(response.body.map((admin: IAdmin) => admin.name)).to.include.members([testAdminFields1.name, testAdminFields2.name])
		})

		it('should not send the password', async function () {
			const response = await agent.get('/v1/admins').set('Cookie', sessionCookie)

			expect(response.body[0]).to.not.have.property('password')
		})
	})

	describe('PATCH /v1/admins', function () {
		const testAdminFields1 = {
			name: 'admin1',
			password: 'password1'
		}

		const updatedFields = {
			name: 'admin2',
			password: 'password2'
		}

		let originalAdmin: IAdmin

		beforeEach(async function () {
			originalAdmin = await AdminModel.create(testAdminFields1)
		})

		it('should patch an admin', async function () {
			await agent.patch(`/v1/admins/${originalAdmin?.id}`).send(updatedFields).set('Cookie', sessionCookie)
			const admin = await AdminModel.findOne({ name: updatedFields.name })

			expect(admin?.name).to.equal(updatedFields.name)
			const passwordMatch = await admin?.comparePassword(updatedFields.password)
			expect(passwordMatch).to.be.true
		})

		it('should have status 200', async function () {
			const response = await agent.patch(`/v1/admins/${originalAdmin?.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.patch(`/v1/admins/${originalAdmin?.id}`).send(updatedFields)

			expect(response).to.have.status(403)
		})

		it('should return the patched admin', async function () {
			const res = await agent.patch(`/v1/admins/${originalAdmin?.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(res.body.name).to.equal(updatedFields.name)
		})

		it('should not return the password', async function () {
			const res = await agent.patch(`/v1/admins/${originalAdmin?.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(res.body.password).to.be.undefined
		})

		it('should allow a partial update', async function () {
			await agent.patch(`/v1/admins/${originalAdmin?.id}`).send({ name: updatedFields.name }).set('Cookie', sessionCookie)
			const admin = await AdminModel.findOne({ name: updatedFields.name })

			expect(admin?.name).to.equal(updatedFields.name)
		})
	})
})
