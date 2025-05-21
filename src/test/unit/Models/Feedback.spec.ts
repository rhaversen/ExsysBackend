/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import { describe, it } from 'mocha'

import FeedbackModel from '../../../app/models/Feedback.js'
import '../../testSetup.js' // Initializes the testing environment

describe('Feedback Model', function () {
	const validFeedbackData = {
		feedback: 'This is a piece of feedback.'
	}

	const validFeedbackDataWithName = {
		feedback: 'This is another piece of feedback.',
		name: 'John Doe'
	}

	it('should create a valid feedback document without a name', async function () {
		const feedback = await FeedbackModel.create(validFeedbackData)
		expect(feedback).to.exist
		expect(feedback.feedback).to.equal(validFeedbackData.feedback)
		expect(feedback.name).to.be.undefined
		expect(feedback.isRead).to.be.false
		expect(feedback.createdAt).to.exist
		expect(feedback.updatedAt).to.exist
	})

	it('should create a valid feedback document with a name', async function () {
		const feedback = await FeedbackModel.create(validFeedbackDataWithName)
		expect(feedback).to.exist
		expect(feedback.feedback).to.equal(validFeedbackDataWithName.feedback)
		expect(feedback.name).to.equal(validFeedbackDataWithName.name)
		expect(feedback.isRead).to.be.false
	})

	it('should trim the feedback text', async function () {
		const feedbackWithSpaces = { ...validFeedbackData, feedback: '  Trimmed feedback.  ' }
		const feedback = await FeedbackModel.create(feedbackWithSpaces)
		expect(feedback.feedback).to.equal('Trimmed feedback.')
	})

	it('should trim the name if provided', async function () {
		const feedbackWithSpacedName = { ...validFeedbackDataWithName, name: '  Spaced Name  ' }
		const feedback = await FeedbackModel.create(feedbackWithSpacedName)
		expect(feedback.name).to.equal('Spaced Name')
	})

	it('should require feedback text', async function () {
		let errorOccurred = false
		try {
			await FeedbackModel.create({ name: 'Anonymous' }) // Missing feedback
		} catch {
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should enforce maxLength for feedback text', async function () {
		let errorOccurred = false
		const longFeedback = 'f'.repeat(1001)
		try {
			await FeedbackModel.create({ feedback: longFeedback })
		} catch {
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should enforce maxLength for name', async function () {
		let errorOccurred = false
		const longName = 'n'.repeat(101)
		try {
			await FeedbackModel.create({ feedback: 'Valid feedback', name: longName })
		} catch {
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should default "isRead" to false', async function () {
		const feedback = await FeedbackModel.create(validFeedbackData)
		expect(feedback.isRead).to.be.false
	})

	it('should allow setting "isRead" to true', async function () {
		const feedbackData = { ...validFeedbackData, isRead: true }
		const feedback = await FeedbackModel.create(feedbackData)
		expect(feedback.isRead).to.be.true
	})
})
