/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose from 'mongoose'

import { FeedbackRatingModel } from '../../../app/models/FeedbackRating.js'
import '../../testSetup.js'

describe('FeedbackRating Model', function () {
	const validKioskId = new mongoose.Types.ObjectId()

	const validRatingDataPositive = {
		kioskId: validKioskId,
		rating: 'positive' as const
	}

	const validRatingDataNegative = {
		kioskId: validKioskId,
		rating: 'negative' as const
	}

	it('should create a valid positive feedback rating', async function () {
		const feedbackRating = await FeedbackRatingModel.create(validRatingDataPositive)
		expect(feedbackRating).to.exist
		expect(feedbackRating.kioskId.toString()).to.equal(validKioskId.toString())
		expect(feedbackRating.rating).to.equal('positive')
		expect(feedbackRating.createdAt).to.exist
		expect(feedbackRating.updatedAt).to.exist
	})

	it('should create a valid negative feedback rating', async function () {
		const feedbackRating = await FeedbackRatingModel.create(validRatingDataNegative)
		expect(feedbackRating).to.exist
		expect(feedbackRating.kioskId.toString()).to.equal(validKioskId.toString())
		expect(feedbackRating.rating).to.equal('negative')
	})

	it('should require kioskId', async function () {
		let errorOccurred = false
		try {
			await FeedbackRatingModel.create({ rating: 'positive' })
		} catch {
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should require rating', async function () {
		let errorOccurred = false
		try {
			await FeedbackRatingModel.create({ kioskId: validKioskId })
		} catch {
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should only allow "positive" or "negative" as rating values', async function () {
		let errorOccurred = false
		try {
			await FeedbackRatingModel.create({ kioskId: validKioskId, rating: 'invalid' })
		} catch {
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should allow multiple ratings from the same kiosk', async function () {
		const rating1 = await FeedbackRatingModel.create(validRatingDataPositive)
		const rating2 = await FeedbackRatingModel.create(validRatingDataNegative)
		expect(rating1).to.exist
		expect(rating2).to.exist
		expect(rating1._id.toString()).to.not.equal(rating2._id.toString())
	})
})
