/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it, beforeEach } from 'mocha'
import mongoose from 'mongoose'

import AdminModel from '../../../app/models/Admin.js'
import FeedbackModel, { type IFeedback } from '../../../app/models/Feedback.js'
import { getChaiAgent as agent, extractConnectSid } from '../../testSetup.js'

describe('Feedback routes', function () {
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

	describe('POST /v1/feedback', function () {
		const testFeedbackFields1 = {
			feedback: 'This is a test feedback.'
		}
		const testFeedbackFields2 = {
			feedback: 'Another test feedback.',
			name: 'Test User'
		}

		it('should have status 201 and create feedback without a name', async function () {
			const response = await agent().post('/api/v1/feedback').send(testFeedbackFields1)
			expect(response).to.have.status(201)
			expect(response.body).to.have.property('feedback', testFeedbackFields1.feedback)
			expect(response.body).to.not.have.property('name')
			expect(response.body).to.have.property('isRead', false)

			const feedback = await FeedbackModel.findById(response.body._id)
			expect(feedback).to.exist
			expect(feedback?.feedback).to.equal(testFeedbackFields1.feedback)
			expect(feedback?.name).to.be.undefined
		})

		it('should have status 201 and create feedback even if not logged in', async function () {
			const response = await agent().post('/api/v1/feedback').send(testFeedbackFields1) // No session cookie
			expect(response).to.have.status(201)
			expect(response.body).to.have.property('feedback', testFeedbackFields1.feedback)

			const feedback = await FeedbackModel.findOne({ feedback: testFeedbackFields1.feedback })
			expect(feedback).to.exist
		})

		it('should have status 201 and create feedback with a name', async function () {
			const response = await agent().post('/api/v1/feedback').send(testFeedbackFields2)
			expect(response).to.have.status(201)
			expect(response.body).to.have.property('feedback', testFeedbackFields2.feedback)
			expect(response.body).to.have.property('name', testFeedbackFields2.name)

			const feedback = await FeedbackModel.findById(response.body._id)
			expect(feedback).to.exist
			expect(feedback?.feedback).to.equal(testFeedbackFields2.feedback)
			expect(feedback?.name).to.equal(testFeedbackFields2.name)
		})

		it('should return the newly created object', async function () {
			const response = await agent().post('/api/v1/feedback').send(testFeedbackFields1)
			expect(response.body).to.have.property('_id')
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
		})

		it('should not allow setting the _id', async function () {
			const newId = new mongoose.Types.ObjectId().toString()
			const fieldsWithId = { ...testFeedbackFields1, _id: newId }
			await agent().post('/api/v1/feedback').send(fieldsWithId)
			const feedback = await FeedbackModel.findOne({ feedback: testFeedbackFields1.feedback })
			expect(feedback?.id.toString()).to.not.equal(newId)
		})

		it('should fail with status 400 if feedback text is missing', async function () {
			const response = await agent().post('/api/v1/feedback').send({ name: 'Test User' })
			expect(response).to.have.status(400)
		})

		it('should fail with status 400 if feedback text is too long', async function () {
			const longFeedback = 'a'.repeat(1001)
			const response = await agent().post('/api/v1/feedback').send({ feedback: longFeedback })
			expect(response).to.have.status(400)
		})

		it('should fail with status 400 if name is too long', async function () {
			const longName = 'a'.repeat(101)
			const response = await agent().post('/api/v1/feedback').send({ feedback: 'Valid feedback', name: longName })
			expect(response).to.have.status(400)
		})
	})

	describe('GET /v1/feedback/:id', function () {
		let testFeedback: IFeedback

		beforeEach(async function () {
			testFeedback = await FeedbackModel.create({ feedback: 'Specific feedback' })
		})

		it('should have status 200 and return the feedback if admin', async function () {
			const response = await agent().get(`/api/v1/feedback/${testFeedback.id}`).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.have.property('_id', testFeedback.id)
			expect(response.body).to.have.property('feedback', testFeedback.feedback)
		})

		it('should have status 403 if not admin', async function () {
			const response = await agent().get(`/api/v1/feedback/${testFeedback.id}`)
			expect(response).to.have.status(403)
		})

		it('should return 404 if the feedback does not exist (admin)', async function () {
			const response = await agent().get(`/api/v1/feedback/${new mongoose.Types.ObjectId().toString()}`).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(404)
		})
	})

	describe('GET /v1/feedback', function () {
		beforeEach(async function () {
			await FeedbackModel.create({ feedback: 'Feedback 1', name: 'User A' })
			await FeedbackModel.create({ feedback: 'Feedback 2', isRead: true })
		})

		it('should have status 200 and return all feedbacks if admin', async function () {
			const response = await agent().get('/api/v1/feedback').set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.be.an('array').with.lengthOf(2)
			expect(response.body.map((fb: IFeedback) => fb.feedback)).to.include.members(['Feedback 1', 'Feedback 2'])
		})

		it('should have status 403 if not admin', async function () {
			const response = await agent().get('/api/v1/feedback')
			expect(response).to.have.status(403)
		})
	})

	describe('PATCH /v1/feedback/:id', function () {
		let testFeedback: IFeedback

		beforeEach(async function () {
			testFeedback = await FeedbackModel.create({ feedback: 'Original feedback', name: 'Original Name' })
		})

		it('should have status 200 and update feedback if admin', async function () {
			const updates = { feedback: 'Updated feedback text', isRead: true, name: 'Updated Name' }
			const response = await agent().patch(`/api/v1/feedback/${testFeedback.id}`).send(updates).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.have.property('feedback', updates.feedback)
			expect(response.body).to.have.property('isRead', updates.isRead)
			expect(response.body).to.have.property('name', updates.name)

			const dbFeedback = await FeedbackModel.findById(testFeedback.id)
			expect(dbFeedback?.feedback).to.equal(updates.feedback)
			expect(dbFeedback?.isRead).to.equal(updates.isRead)
			expect(dbFeedback?.name).to.equal(updates.name)
		})

		it('should allow removing the name by sending null', async function () {
			const updates = { name: null }
			const response = await agent().patch(`/api/v1/feedback/${testFeedback.id}`).send(updates).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body.name).to.be.null

			const dbFeedback = await FeedbackModel.findById(testFeedback.id)
			expect(dbFeedback?.name).to.be.null
		})

		it('should have status 403 if not admin', async function () {
			const updates = { feedback: 'Attempted update' }
			const response = await agent().patch(`/api/v1/feedback/${testFeedback.id}`).send(updates)
			expect(response).to.have.status(403)
		})

		it('should return 404 if feedback does not exist (admin)', async function () {
			const updates = { feedback: 'Non-existent update' }
			const response = await agent().patch(`/api/v1/feedback/${new mongoose.Types.ObjectId().toString()}`).send(updates).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(404)
		})

		it('should return current document if no changes are applied', async function () {
			const response = await agent().patch(`/api/v1/feedback/${testFeedback.id}`).send({}).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.have.property('feedback', testFeedback.feedback)
			expect(response.body).to.have.property('name', testFeedback.name)
		})

		it('should fail with status 400 if feedback text is too long on update', async function () {
			const longFeedback = 'b'.repeat(1001)
			const response = await agent().patch(`/api/v1/feedback/${testFeedback.id}`).send({ feedback: longFeedback }).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(400)
		})

		it('should fail with status 400 if name is too long on update', async function () {
			const longName = 'b'.repeat(101)
			const response = await agent().patch(`/api/v1/feedback/${testFeedback.id}`).send({ name: longName }).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(400)
		})
	})

	describe('DELETE /v1/feedback/:id', function () {
		let testFeedback: IFeedback

		beforeEach(async function () {
			testFeedback = await FeedbackModel.create({ feedback: 'Feedback to delete' })
		})

		it('should have status 200 and delete feedback if admin', async function () {
			const response = await agent().delete(`/api/v1/feedback/${testFeedback.id}`).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.have.property('message', 'Feedback deleted successfully')
			expect(response.body).to.have.property('id', testFeedback.id)

			const dbFeedback = await FeedbackModel.findById(testFeedback.id)
			expect(dbFeedback).to.be.null
		})

		it('should have status 403 if not admin', async function () {
			const response = await agent().delete(`/api/v1/feedback/${testFeedback.id}`)
			expect(response).to.have.status(403)
		})

		it('should return 404 if feedback does not exist (admin)', async function () {
			const response = await agent().delete(`/api/v1/feedback/${new mongoose.Types.ObjectId().toString()}`).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(404)
		})
	})
})
