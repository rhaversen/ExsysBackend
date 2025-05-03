/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'

import KioskModel from '../../../app/models/Kiosk.js'
import ReaderModel from '../../../app/models/Reader.js'

import '../../testSetup.js'

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
		} catch {
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
		} catch {
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
		} catch {
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

	describe('Delete middleware', function () {
		describe('Pre-delete middleware (deleteOne / findOneAndDelete)', function () {
			it('should set readerId to null in any kiosks when deleted', async function () {
				const reader = await ReaderModel.create({
					apiReferenceId: '12345',
					readerTag: '54321'
				})
				const kiosk = await KioskModel.create({
					name: 'Test Kiosk',
					readerId: reader.id,
					kioskTag: '11111'
				})

				await ReaderModel.deleteOne({ _id: reader.id })

				const updatedKiosk = await KioskModel.findById(kiosk.id)
				expect(updatedKiosk?.readerId).to.be.null // Changed assertion to expect null
			})

			it('should not affect other kiosks when deleting a reader', async function () {
				const reader1 = await ReaderModel.create({
					apiReferenceId: '12345',
					readerTag: '54321'
				})
				const reader2 = await ReaderModel.create({
					apiReferenceId: '67890',
					readerTag: '98765'
				})
				const kiosk1 = await KioskModel.create({
					name: 'Test Kiosk 1',
					readerId: reader1.id,
					kioskTag: '11111'
				})
				const kiosk2 = await KioskModel.create({
					name: 'Test Kiosk 2',
					readerId: reader2.id,
					kioskTag: '22222'
				})

				await ReaderModel.deleteOne({ _id: reader1.id })

				const updatedKiosk1 = await KioskModel.findById(kiosk1.id)
				const updatedKiosk2 = await KioskModel.findById(kiosk2.id)
				expect(updatedKiosk1?.readerId).to.be.null
				expect(updatedKiosk2?.readerId?.toString()).to.equal(reader2.id.toString())
			})
		})

		describe('Pre-delete-many middleware', function () {
			it('should set readerId to null in multiple kiosks when deleted via deleteMany', async function () {
				const reader1 = await ReaderModel.create({
					apiReferenceId: '12345',
					readerTag: '54321'
				})
				const reader2 = await ReaderModel.create({
					apiReferenceId: '67890',
					readerTag: '98765'
				})
				const kiosk1 = await KioskModel.create({
					name: 'Test Kiosk 1',
					readerId: reader1.id,
					kioskTag: '11111'
				})
				const kiosk2 = await KioskModel.create({
					name: 'Test Kiosk 2',
					readerId: reader2.id,
					kioskTag: '22222'
				})

				await ReaderModel.deleteMany({ _id: { $in: [reader1.id, reader2.id] } })

				const updatedKiosk1 = await KioskModel.findById(kiosk1.id)
				const updatedKiosk2 = await KioskModel.findById(kiosk2.id)
				expect(updatedKiosk1?.readerId).to.be.null
				expect(updatedKiosk2?.readerId).to.be.null
			})

			it('should not affect other kiosks when deleting readers via deleteMany', async function () {
				const reader1 = await ReaderModel.create({
					apiReferenceId: '12345',
					readerTag: '54321'
				})
				const reader2 = await ReaderModel.create({
					apiReferenceId: '67890',
					readerTag: '98765'
				})
				const reader3 = await ReaderModel.create({
					apiReferenceId: '11223',
					readerTag: '33445'
				})
				const kiosk1 = await KioskModel.create({
					name: 'Test Kiosk 1',
					readerId: reader1.id,
					kioskTag: '11111'
				})
				const kiosk2 = await KioskModel.create({
					name: 'Test Kiosk 2',
					readerId: reader2.id,
					kioskTag: '22222'
				})
				const kiosk3 = await KioskModel.create({
					name: 'Test Kiosk 3',
					readerId: reader3.id,
					kioskTag: '33333'
				})

				await ReaderModel.deleteMany({ _id: { $in: [reader1.id, reader2.id] } })

				const updatedKiosk1 = await KioskModel.findById(kiosk1.id)
				const updatedKiosk2 = await KioskModel.findById(kiosk2.id)
				const updatedKiosk3 = await KioskModel.findById(kiosk3.id)
				expect(updatedKiosk1?.readerId).to.be.null
				expect(updatedKiosk2?.readerId).to.be.null
				expect(updatedKiosk3?.readerId?.toString()).to.equal(reader3.id.toString())
			})
		})
	})
})
