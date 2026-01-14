/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import { describe, it } from 'mocha'

import FeedbackMessageModel from '../../../app/models/FeedbackMessage.js'
import '../../testSetup.js'

describe('FeedbackMessage Model', function () {
	const validMessageData = {
		message: 'This is a piece of feedback.'
	}

	const validMessageDataWithName = {
		message: 'This is another piece of feedback.',
		name: 'John Doe'
	}

	it('should create a valid feedback message document without a name', async function () {
		const feedbackMessage = await FeedbackMessageModel.create(validMessageData)
		expect(feedbackMessage).to.exist
		expect(feedbackMessage.message).to.equal(validMessageData.message)
		expect(feedbackMessage.name).to.be.undefined
		expect(feedbackMessage.isRead).to.be.false
		expect(feedbackMessage.createdAt).to.exist
		expect(feedbackMessage.updatedAt).to.exist
	})

	it('should create a valid feedback message document with a name', async function () {
		const feedbackMessage = await FeedbackMessageModel.create(validMessageDataWithName)
		expect(feedbackMessage).to.exist
		expect(feedbackMessage.message).to.equal(validMessageDataWithName.message)
		expect(feedbackMessage.name).to.equal(validMessageDataWithName.name)
		expect(feedbackMessage.isRead).to.be.false
	})

	it('should trim the message text', async function () {
		const messageWithSpaces = { ...validMessageData, message: '  Trimmed feedback.  ' }
		const feedbackMessage = await FeedbackMessageModel.create(messageWithSpaces)
		expect(feedbackMessage.message).to.equal('Trimmed feedback.')
	})

	it('should trim the name if provided', async function () {
		const messageWithSpacedName = { ...validMessageDataWithName, name: '  Spaced Name  ' }
		const feedbackMessage = await FeedbackMessageModel.create(messageWithSpacedName)
		expect(feedbackMessage.name).to.equal('Spaced Name')
	})

	it('should require message text', async function () {
		let errorOccurred = false
		try {
			await FeedbackMessageModel.create({ name: 'Anonymous' })
		} catch {
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should enforce maxLength for message text', async function () {
		let errorOccurred = false
		const longMessage = 'f'.repeat(1001)
		try {
			await FeedbackMessageModel.create({ message: longMessage })
		} catch {
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should enforce maxLength for name', async function () {
		let errorOccurred = false
		const longName = 'n'.repeat(101)
		try {
			await FeedbackMessageModel.create({ message: 'Valid feedback', name: longName })
		} catch {
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should default "isRead" to false', async function () {
		const feedbackMessage = await FeedbackMessageModel.create(validMessageData)
		expect(feedbackMessage.isRead).to.be.false
	})

	it('should allow setting "isRead" to true', async function () {
		const messageData = { ...validMessageData, isRead: true }
		const feedbackMessage = await FeedbackMessageModel.create(messageData)
		expect(feedbackMessage.isRead).to.be.true
	})
})
