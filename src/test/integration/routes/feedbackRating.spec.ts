/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it, beforeEach } from 'mocha'
import mongoose from 'mongoose'

import AdminModel from '../../../app/models/Admin.js'
import { FeedbackRatingModel, type IFeedbackRating } from '../../../app/models/FeedbackRating.js'
import KioskModel from '../../../app/models/Kiosk.js'
import { getChaiAgent as agent, extractConnectSid } from '../../testSetup.js'

describe('FeedbackRating routes', function () {
	let adminSessionCookie: string
	let kioskSessionCookie: string
	let testKioskId: string

	beforeEach(async function () {
		const adminFields = {
			name: 'FeedbackRatingAdmin',
			password: 'feedbackRatingPassword'
		}
		await AdminModel.create(adminFields)
		const adminResponse = await agent().post('/api/v1/auth/login-admin-local').send(adminFields)
		adminSessionCookie = extractConnectSid(adminResponse.headers['set-cookie'])

		const testKiosk = await KioskModel.create({
			name: 'Test Kiosk',
			kioskTag: 'test-kiosk-tag',
			password: 'kioskPassword',
			enabledActivities: []
		})
		testKioskId = testKiosk.id

		const kioskResponse = await agent().post('/api/v1/auth/login-kiosk-local').send({
			kioskTag: 'test-kiosk-tag',
			password: 'kioskPassword'
		})
		kioskSessionCookie = extractConnectSid(kioskResponse.headers['set-cookie'])
	})

	describe('POST /v1/feedback/rating', function () {
		it('should have status 201 and create positive feedback rating if kiosk', async function () {
			const response = await agent().post('/api/v1/feedback/rating').send({ rating: 'positive' }).set('Cookie', kioskSessionCookie)
			expect(response).to.have.status(201)
			expect(response.body).to.have.property('rating', 'positive')
			expect(response.body).to.have.property('kioskId', testKioskId)

			const feedbackRating = await FeedbackRatingModel.findById(response.body._id)
			expect(feedbackRating).to.exist
			expect(feedbackRating?.rating).to.equal('positive')
		})

		it('should have status 201 and create negative feedback rating if kiosk', async function () {
			const response = await agent().post('/api/v1/feedback/rating').send({ rating: 'negative' }).set('Cookie', kioskSessionCookie)
			expect(response).to.have.status(201)
			expect(response.body).to.have.property('rating', 'negative')
			expect(response.body).to.have.property('kioskId', testKioskId)
		})

		it('should return the newly created object', async function () {
			const response = await agent().post('/api/v1/feedback/rating').send({ rating: 'positive' }).set('Cookie', kioskSessionCookie)
			expect(response.body).to.have.property('_id')
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().post('/api/v1/feedback/rating').send({ rating: 'positive' })
			expect(response).to.have.status(403)
		})

		it('should have status 403 if logged in as admin (not kiosk)', async function () {
			const response = await agent().post('/api/v1/feedback/rating').send({ rating: 'positive' }).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(403)
		})

		it('should fail with status 400 if rating is missing', async function () {
			const response = await agent().post('/api/v1/feedback/rating').send({}).set('Cookie', kioskSessionCookie)
			expect(response).to.have.status(400)
		})

		it('should fail with status 400 if rating is invalid', async function () {
			const response = await agent().post('/api/v1/feedback/rating').send({ rating: 'invalid' }).set('Cookie', kioskSessionCookie)
			expect(response).to.have.status(400)
		})
	})

	describe('GET /v1/feedback/rating', function () {
		beforeEach(async function () {
			await FeedbackRatingModel.create({ kioskId: testKioskId, rating: 'positive' })
			await FeedbackRatingModel.create({ kioskId: testKioskId, rating: 'negative' })
		})

		it('should have status 200 and return all feedback ratings if admin', async function () {
			const response = await agent().get('/api/v1/feedback/rating').set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.be.an('array').with.lengthOf(2)
			expect(response.body.map((fr: IFeedbackRating) => fr.rating)).to.include.members(['positive', 'negative'])
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().get('/api/v1/feedback/rating')
			expect(response).to.have.status(403)
		})

		it('should have status 403 if logged in as kiosk (not admin)', async function () {
			const response = await agent().get('/api/v1/feedback/rating').set('Cookie', kioskSessionCookie)
			expect(response).to.have.status(403)
		})
	})

	describe('DELETE /v1/feedback/rating/:id', function () {
		let testRating: IFeedbackRating

		beforeEach(async function () {
			testRating = await FeedbackRatingModel.create({ kioskId: testKioskId, rating: 'positive' })
		})

		it('should have status 200 and delete feedback rating if admin', async function () {
			const response = await agent().delete(`/api/v1/feedback/rating/${testRating.id}`).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(200)
			expect(response.body).to.have.property('_id', testRating.id)
			expect(response.body).to.have.property('rating', 'positive')

			const dbRating = await FeedbackRatingModel.findById(testRating.id)
			expect(dbRating).to.be.null
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().delete(`/api/v1/feedback/rating/${testRating.id}`)
			expect(response).to.have.status(403)
		})

		it('should have status 403 if logged in as kiosk (not admin)', async function () {
			const response = await agent().delete(`/api/v1/feedback/rating/${testRating.id}`).set('Cookie', kioskSessionCookie)
			expect(response).to.have.status(403)
		})

		it('should return 404 if feedback rating does not exist (admin)', async function () {
			const response = await agent().delete(`/api/v1/feedback/rating/${new mongoose.Types.ObjectId().toString()}`).set('Cookie', adminSessionCookie)
			expect(response).to.have.status(404)
		})
	})
})
