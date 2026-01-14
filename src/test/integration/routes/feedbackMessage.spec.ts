/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it, beforeEach } from 'mocha'
import mongoose from 'mongoose'

import AdminModel from '../../../app/models/Admin.js'
import { FeedbackMessageModel, type IFeedbackMessage } from '../../../app/models/FeedbackMessage.js'
import { getChaiAgent as agent, extractConnectSid } from '../../testSetup.js'

describe('FeedbackMessage routes', function () {
	let adminSessionCookie: string

	beforeEach(async function () {
		const adminFields = {
			name: 'FeedbackAdmin',
			password: 'feedbackPassword'
		}
		await AdminModel.create(adminFields)
		const response = await agent().post('/api/v1/auth/login-admin-local').send(adminFields)
		adminSessionCookie = extractConnectSid(response.headers['set-cookie'])
	})

	describe('POST /v1/feedback/message', function () {
		const testMessageFields1 = {
			message: 'This is a test feedback.'
		}
		const testMessageFields2 = {
			message: 'Another test feedback.',
			name: 'Test User'
		}

		it('should have status 201 and create feedback message without a name', async function () {
			const response = await agent().post('/api/v1/feedback/message').send(testMessageFields1)
			expect(response).to.have.status(201)
			expect(response.body).to.have.property('message', testMessageFields1.message)
			expect(response.body).to.not.have.property('name')
			expect(response.body).to.have.property('isRead', false)

			const feedbackMessage = await FeedbackMessageModel.findById(response.body._id)
			expect(feedbackMessage).to.exist
			expect(feedbackMessage?.message).to.equal(testMessageFields1.message)
			expect(feedbackMessage?.name).to.be.undefined
		})

		it('should have status 201 and create feedback message even if not logged in', async function () {
			const response = await agent().post('/api/v1/feedback/message').send(testMessageFields1)
			expect(response).to.have.status(201)
			expect(response.body).to.have.property('message', testMessageFields1.message)

			const feedbackMessage = await FeedbackMessageModel.findOne({ message: testMessageFields1.message })
			expect(feedbackMessage).to.exist
		})

		it('should have status 201 and create feedback message with a name', async function () {
			const response = await agent().post('/api/v1/feedback/message').send(testMessageFields2)
			expect(response).to.have.status(201)
			expect(response.body).to.have.property('message', testMessageFields2.message)
			expect(response.body).to.have.property('name', testMessageFields2.name)

			const feedbackMessage = await FeedbackMessageModel.findById(response.body._id)
			expect(feedbackMessage).to.exist
			expect(feedbackMessage?.message).to.equal(testMessageFields2.message)
			expect(feedbackMessage?.name).to.equal(testMessageFields2.name)
		})

		it('should return the newly created object', async function () {
			const response = await agent().post('/api/v1/feedback/message').send(testMessageFields1)
			expect(response.body).to.have.property('_id')
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
		})

		it('should not allow setting the _id', async function () {
			const newId = new mongoose.Types.ObjectId().toString()
			const fieldsWithId = { ...testMessageFields1, _id: newId }
			await agent().post('/api/v1/feedback/message').send(fieldsWithId)
			const feedbackMessage = await FeedbackMessageModel.findOne({ message: testMessageFields1.message })
			expect(feedbackMessage?.id.toString()).to.not.equal(newId)
		})

		it('should fail with status 400 if message text is missing', async function () {
			const response = await agent().post('/api/v1/feedback/message').send({ name: 'Test User' })
			expect(response).to.have.status(400)
		})

		it('should fail with status 400 if message text is too long', async function () {
			const longMessage = 'a'.repeat(1001)
			const response = await agent().post('/api/v1/feedback/message').send({ message: longMessage })
			expect(response).to.have.status(400)
		})

		it('should fail with status 400 if name is too long', async function () {
			const longName = 'a'.repeat(101)
			const response = await agent().post('/api/v1/feedback/message').send({ message: 'Valid feedback', name: longName })
			expect(response).to.have.status(400)
		})
	})

	describe('GET /v1/feedback/message/:id', function () {
		let testMessage: IFeedbackMessage

		beforeEach(async function () {
			testMessage = await FeedbackMessageModel.create({ message: 'Specific feedback' })
		})

		it('should have status 200 and return the feedback message if admin', async function () {
			const response = await agent().get(`/api/v1/feedback/message/${testMessage.id}`).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.have.property('_id', testMessage.id)
			expect(response.body).to.have.property('message', testMessage.message)
		})

		it('should have status 403 if not admin', async function () {
			const response = await agent().get(`/api/v1/feedback/message/${testMessage.id}`)
			expect(response).to.have.status(403)
		})

		it('should return 404 if the feedback message does not exist (admin)', async function () {
			const response = await agent().get(`/api/v1/feedback/message/${new mongoose.Types.ObjectId().toString()}`).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(404)
		})
	})

	describe('GET /v1/feedback/message', function () {
		beforeEach(async function () {
			await FeedbackMessageModel.create({ message: 'Feedback 1', name: 'User A' })
			await FeedbackMessageModel.create({ message: 'Feedback 2', isRead: true })
		})

		it('should have status 200 and return all feedback messages if admin', async function () {
			const response = await agent().get('/api/v1/feedback/message').set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.be.an('array').with.lengthOf(2)
			expect(response.body.map((fb: IFeedbackMessage) => fb.message)).to.include.members(['Feedback 1', 'Feedback 2'])
		})

		it('should have status 403 if not admin', async function () {
			const response = await agent().get('/api/v1/feedback/message')
			expect(response).to.have.status(403)
		})
	})

	describe('PATCH /v1/feedback/message/:id', function () {
		let testMessage: IFeedbackMessage

		beforeEach(async function () {
			testMessage = await FeedbackMessageModel.create({ message: 'Original feedback', name: 'Original Name' })
		})

		it('should have status 200 and update feedback message if admin', async function () {
			const updates = { message: 'Updated feedback text', isRead: true, name: 'Updated Name' }
			const response = await agent().patch(`/api/v1/feedback/message/${testMessage.id}`).send(updates).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.have.property('message', updates.message)
			expect(response.body).to.have.property('isRead', updates.isRead)
			expect(response.body).to.have.property('name', updates.name)

			const dbMessage = await FeedbackMessageModel.findById(testMessage.id)
			expect(dbMessage?.message).to.equal(updates.message)
			expect(dbMessage?.isRead).to.equal(updates.isRead)
			expect(dbMessage?.name).to.equal(updates.name)
		})

		it('should allow removing the name by sending null', async function () {
			const updates = { name: null }
			const response = await agent().patch(`/api/v1/feedback/message/${testMessage.id}`).send(updates).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body.name).to.be.null

			const dbMessage = await FeedbackMessageModel.findById(testMessage.id)
			expect(dbMessage?.name).to.be.null
		})

		it('should have status 403 if not admin', async function () {
			const updates = { message: 'Attempted update' }
			const response = await agent().patch(`/api/v1/feedback/message/${testMessage.id}`).send(updates)
			expect(response).to.have.status(403)
		})

		it('should return 404 if feedback message does not exist (admin)', async function () {
			const updates = { message: 'Non-existent update' }
			const response = await agent().patch(`/api/v1/feedback/message/${new mongoose.Types.ObjectId().toString()}`).send(updates).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(404)
		})

		it('should return current document if no changes are applied', async function () {
			const response = await agent().patch(`/api/v1/feedback/message/${testMessage.id}`).send({}).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.have.property('message', testMessage.message)
			expect(response.body).to.have.property('name', testMessage.name)
		})

		it('should fail with status 400 if message text is too long on update', async function () {
			const longMessage = 'b'.repeat(1001)
			const response = await agent().patch(`/api/v1/feedback/message/${testMessage.id}`).send({ message: longMessage }).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(400)
		})

		it('should fail with status 400 if name is too long on update', async function () {
			const longName = 'b'.repeat(101)
			const response = await agent().patch(`/api/v1/feedback/message/${testMessage.id}`).send({ name: longName }).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(400)
		})
	})

	describe('DELETE /v1/feedback/message/:id', function () {
		let testMessage: IFeedbackMessage

		beforeEach(async function () {
			testMessage = await FeedbackMessageModel.create({ message: 'Feedback to delete' })
		})

		it('should have status 200 and delete feedback message if admin', async function () {
			const response = await agent().delete(`/api/v1/feedback/message/${testMessage.id}`).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.have.property('message', 'Feedback message deleted successfully')
			expect(response.body).to.have.property('id', testMessage.id)

			const dbMessage = await FeedbackMessageModel.findById(testMessage.id)
			expect(dbMessage).to.be.null
		})

		it('should have status 403 if not admin', async function () {
			const response = await agent().delete(`/api/v1/feedback/message/${testMessage.id}`)
			expect(response).to.have.status(403)
		})

		it('should return 404 if feedback message does not exist (admin)', async function () {
			const response = await agent().delete(`/api/v1/feedback/message/${new mongoose.Types.ObjectId().toString()}`).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(404)
		})
	})
})
