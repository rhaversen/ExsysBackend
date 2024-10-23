/* eslint-disable local/enforce-comment-order */
/* eslint-disable typescript/no-unused-vars */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'

// Own modules
import ReaderModel from '../../../app/models/Reader.js'

// Setup test environment
import '../../testSetup.js'
import KioskModel from '../../../app/models/Kiosk.js'

describe('Reader Model', function () {
	it('should create a valid reader', async function () {
		const reader = await ReaderModel.create({
			apiReferenceId: '12345',
			readerTag: '54321'
		})
		expect(reader).to.exist
		expect(reader.apiReferenceId).to.equal('12345')
		expect(reader.readerTag).to.equal('54321')
	})

	it('should not create a reader with no apiReferenceId', async function () {
		let errorOccurred = false
		try {
			await ReaderModel.create({ readerTag: '12345' })
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should set the readerTag by default if not provided', async function () {
		const reader = await ReaderModel.create({ apiReferenceId: '12345' })
		expect(reader).to.exist
		expect(reader.readerTag).to.exist
	})

	it('should trim the apiReferenceId', async function () {
		const reader = await ReaderModel.create({
			apiReferenceId: '  12345  ',
			readerTag: '54321'
		})
		expect(reader).to.exist
		expect(reader.apiReferenceId).to.equal('12345')
	})

	it('should trim the readerTag', async function () {
		const reader = await ReaderModel.create({
			apiReferenceId: '12345',
			readerTag: '  54321  '
		})

		expect(reader).to.exist
		expect(reader.readerTag).to.equal('54321')
	})

	it('should not create a reader with the same apiReferenceId', async function () {
		let errorOccurred = false
		try {
			await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})
			await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '65432'
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a reader with the same readerTag', async function () {
		let errorOccurred = false
		try {
			await ReaderModel.create({
				apiReferenceId: '12345',
				readerTag: '54321'
			})
			await ReaderModel.create({
				apiReferenceId: '23456',
				readerTag: '54321'
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should generate a new readerTag and return it', async function () {
		const reader = await ReaderModel.create({
			apiReferenceId: '12345',
			readerTag: '54321'
		})
		const oldReaderTag = reader.readerTag
		const newReaderTag = await reader.generateNewReaderTag()
		expect(newReaderTag).to.exist
		expect(newReaderTag).to.not.equal(oldReaderTag)
	})

	it('should generate a new readerTag and save it', async function () {
		const reader = await ReaderModel.create({
			apiReferenceId: '12345',
			readerTag: '54321'
		})
		const newReaderTag = await reader.generateNewReaderTag()
		const updatedReader = await ReaderModel.findById(reader.id)
		expect(updatedReader).to.exist
		expect(updatedReader?.readerTag).to.exist
		expect(updatedReader?.readerTag).to.equal(newReaderTag)
	})

	it('should generate a new readerTag that is 5 characters long', async function () {
		const reader = await ReaderModel.create({
			apiReferenceId: '12345',
			readerTag: '54321'
		})
		await reader.generateNewReaderTag()
		expect(reader.readerTag).to.have.lengthOf(5)
	})

	it('should generate a new readerTag that only contains numbers', async function () {
		const reader = await ReaderModel.create({
			apiReferenceId: '12345',
			readerTag: '54321'
		})
		await reader.generateNewReaderTag()
		expect(reader.readerTag).to.match(/^[0-9]+$/)
	})

	it('should remove the reader from any kiosks when deleted', async function () {
		const reader = await ReaderModel.create({
			apiReferenceId: '12345',
			readerTag: '54321'
		})
		const kiosk = await KioskModel.create({
			name: 'Test Kiosk',
			readerId: reader.id,
			password: 'Test Password'
		})

		await ReaderModel.deleteOne({ _id: reader.id })

		const updatedKiosk = await KioskModel.findById(kiosk.id)
		expect(updatedKiosk?.readerId).to.be.undefined
	})
})
