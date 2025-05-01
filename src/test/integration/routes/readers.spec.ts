/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'

import AdminModel from '../../../app/models/Admin.js'
import ReaderModel from '../../../app/models/Reader.js'
import { getChaiAppServer as agent } from '../../testSetup.js'

describe('Readers routes', function () {
	let sessionCookie: string

	beforeEach(async function () {
		// Log the agent in to get a valid session
		const adminFields = {
			name: 'Agent Admin',
			password: 'agentPassword'
		}
		await AdminModel.create(adminFields)

		const response = await agent().post('/api/v1/auth/login-admin-local').send(adminFields)
		sessionCookie = response.headers['set-cookie']
	})

	describe('POST /v1/readers', function () {
		it('should have status 201 when creating a reader', async function () {
			const response = await agent().post('/api/v1/readers').set('Cookie', sessionCookie).send({
				pairingCode: '12345',
				readerTag: '54321'
			})

			expect(response.status).to.equal(201)
		})

		it('should have status 403 when not logged in', async function () {
			const response = await agent().post('/api/v1/readers').send({
				pairingCode: '12345',
				readerTag: '54321'
			})

			expect(response.status).to.equal(403)
		})

		it('should return the newly created object', async function () {
			const response = await agent().post('/api/v1/readers').send({
				pairingCode: '12345',
				readerTag: '54321'
			}).set('Cookie', sessionCookie)

			const reader = await ReaderModel.findOne({})

			expect(response.status).to.equal(201)
			expect(response.body).to.have.property('readerTag', '54321')
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
			expect(response.body).to.have.property('_id', reader?._id.toString())
		})

		it('should return a readerTag even if not provided', async function () {
			const response = await agent().post('/api/v1/readers').send({ pairingCode: '12345' }).set('Cookie', sessionCookie)

			expect(response.status).to.equal(201)
			expect(response.body).to.have.property('readerTag')
		})

		it('should create a new reader', async function () {
			await agent().post('/api/v1/readers').send({
				pairingCode: '12345',
				readerTag: '54321'
			}).set('Cookie', sessionCookie)

			const reader = await ReaderModel.findOne({})

			expect(reader).to.exist
			expect(reader).to.have.property('readerTag', '54321')
			expect(reader).to.have.property('apiReferenceId')
			expect(reader).to.have.property('createdAt')
			expect(reader).to.have.property('updatedAt')
		})

		it('should have status 400 when missing pairingCode', async function () {
			const response = await agent().post('/api/v1/readers').send({ readerTag: '54321' }).set('Cookie', sessionCookie)

			expect(response.status).to.equal(400)
		})

		it('should not create a new reader when missing pairingCode', async function () {
			await agent().post('/api/v1/readers').send({ readerTag: '54321' }).set('Cookie', sessionCookie)

			const reader = await ReaderModel.findOne({})

			expect(reader).to.not.exist
		})

		it('should have status 201 when missing readerTag', async function () {
			const response = await agent().post('/api/v1/readers').send({ pairingCode: '12345' }).set('Cookie', sessionCookie)

			expect(response.status).to.equal(201)
		})

		it('should create a new reader when missing readerTag', async function () {
			await agent().post('/api/v1/readers').send({ pairingCode: '12345' }).set('Cookie', sessionCookie)

			const reader = await ReaderModel.findOne({})

			expect(reader).to.exist
		})
	})

	describe('GET /v1/readers', function () {
		it('should have status 200', async function () {
			const response = await agent().get('/api/v1/readers').set('Cookie', sessionCookie)

			expect(response.status).to.equal(200)
		})

		it('should have status 403 when not logged in', async function () {
			const response = await agent().get('/api/v1/readers')

			expect(response.status).to.equal(403)
		})

		it('should return an array', async function () {
			const response = await agent().get('/api/v1/readers').set('Cookie', sessionCookie)

			expect(response.body).to.be.an('array')
		})

		it('should return an array of readers', async function () {
			await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})

			const response = await agent().get('/api/v1/readers').set('Cookie', sessionCookie)

			expect(response.body).to.have.lengthOf(1)
			expect(response.body[0]).to.have.property('readerTag', '54321')
			expect(response.body[0]).to.have.property('createdAt')
			expect(response.body[0]).to.have.property('updatedAt')
			expect(response.body[0]).to.have.property('_id')
		})

		it('should return an empty array when no readers exist', async function () {
			const response = await agent().get('/api/v1/readers').set('Cookie', sessionCookie)

			expect(response.body).to.have.lengthOf(0)
		})

		it('should return multiple readers', async function () {
			await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '23456'
			})
			await ReaderModel.create({
				apiReferenceId: '34567',
				readerTag: '45678'
			})

			const response = await agent().get('/api/v1/readers').set('Cookie', sessionCookie)

			expect(response.body).to.have.lengthOf(2)
			expect(response.body.map((reader: any) => reader.readerTag)).to.have.members(['23456', '45678'])
			expect(response.body.map((reader: any) => reader.createdAt)).to.have.lengthOf(2)
			expect(response.body.map((reader: any) => reader.updatedAt)).to.have.lengthOf(2)
			expect(response.body.map((reader: any) => reader._id)).to.have.lengthOf(2)
		})
	})

	describe('PATCH /v1/readers/:id', function () {
		it('should have status 200 when updating a reader', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})

			const response = await agent().patch(`/api/v1/readers/${reader.id}`).send({ readerTag: '65432' }).set('Cookie', sessionCookie)

			expect(response.status).to.equal(200)
		})

		it('should have status 403 when not logged in', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})

			const response = await agent().patch(`/api/v1/readers/${reader.id}`).send({ readerTag: '65432' })

			expect(response.status).to.equal(403)
		})

		it('should return the updated object', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})

			const response = await agent().patch(`/api/v1/readers/${reader.id}`).send({ readerTag: '65432' }).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('readerTag', '65432')
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
			expect(response.body).to.have.property('_id', reader.id.toString())
		})

		it('should update the reader', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})

			await agent().patch(`/api/v1/readers/${reader.id}`).send({ readerTag: '65432' }).set('Cookie', sessionCookie)

			const updatedReader = await ReaderModel.findById(reader._id)

			expect(updatedReader).to.have.property('readerTag', '65432')
		})

		it('should have status 404 when the reader does not exist', async function () {
			const response = await agent().patch('/api/v1/readers/123456789012345678901234').send({ readerTag: '65432' }).set('Cookie', sessionCookie)

			expect(response.status).to.equal(404)
		})

		it('should not update the reader when the reader does not exist', async function () {
			await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})
			await agent().patch('/api/v1/readers/123456789012345678901234').send({ readerTag: '65432' }).set('Cookie', sessionCookie)

			const reader = await ReaderModel.findOne({})

			expect(reader).to.have.property('readerTag', '54321')
		})
	})

	describe('DELETE /v1/readers/:id', function () {
		it('should have status 204 when deleting a reader', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})

			const response = await agent().delete(`/api/v1/readers/${reader.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response.status).to.equal(204)
		})

		it('should have status 403 when not logged in', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})

			const response = await agent().delete(`/api/v1/readers/${reader.id}`).send({ confirm: true })

			expect(response.status).to.equal(403)
		})

		it('should delete the reader', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})

			await agent().delete(`/api/v1/readers/${reader.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			const deletedReader = await ReaderModel.findById(reader._id)

			expect(deletedReader).to.not.exist
		})

		it('should have status 404 when the reader does not exist', async function () {
			await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})

			const response = await agent().delete('/api/v1/readers/123456789012345678901234').send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response.status).to.equal(404)
		})

		it('should not delete the reader when the reader does not exist', async function () {
			await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})

			await agent().delete('/api/v1/readers/123456789012345678901234').send({ confirm: true }).set('Cookie', sessionCookie)

			const reader = await ReaderModel.findOne({})

			expect(reader).to.have.property('readerTag', '54321')
		})

		it('should have status 400 when missing confirm', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})

			const response = await agent().delete(`/api/v1/readers/${reader.id}`).set('Cookie', sessionCookie)

			expect(response.status).to.equal(400)
		})
	})
})
