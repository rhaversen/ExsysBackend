/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose from 'mongoose'

import ActivityModel, { type IActivity } from '../../../app/models/Activity.js'
import KioskModel from '../../../app/models/Kiosk.js'
import ReaderModel from '../../../app/models/Reader.js'
import RoomModel from '../../../app/models/Room.js'

import '../../testSetup.js'

describe('Kiosk Model', function () {
	let testActivity1: IActivity
	let testActivity2: IActivity
	let testKioskField: {
		name: string
		kioskTag: string
		priorityActivities: mongoose.Types.ObjectId[]
		readerId: mongoose.Types.ObjectId
	}

	beforeEach(async function () {
		const testRoom = await RoomModel.create({
			name: 'TestRoom',
			description: 'TestDescription'
		})

		testActivity1 = await ActivityModel.create({
			name: 'TestActivity1',
			roomId: testRoom._id
		})

		testActivity2 = await ActivityModel.create({
			name: 'TestActivity2',
			roomId: testRoom._id
		})

		const testReader = await ReaderModel.create({
			apiReferenceId: '12345',
			readerTag: '12345'
		})

		testKioskField = {
			name: 'Test Kiosk',
			kioskTag: '12345',
			priorityActivities: [testActivity1.id.toString(), testActivity2.id.toString()],
			readerId: testReader.id
		}
	})

	it('should create a valid kiosk', async function () {
		const kiosk = await KioskModel.create(testKioskField)
		expect(kiosk).to.exist
		expect(kiosk.kioskTag).to.equal(testKioskField.kioskTag)
		expect(kiosk).to.have.property('name', testKioskField.name)
		const populatedKiosk = await kiosk?.populate('priorityActivities')
		expect(populatedKiosk?.priorityActivities[0]).to.have.property('id', testKioskField.priorityActivities[0])
	})

	it('should trim the name', async function () {
		const admin = await KioskModel.create({
			...testKioskField,
			name: '  TestKiosk2  '
		})
		expect(admin).to.exist
		expect(admin.name).to.equal('TestKiosk2')
	})

	it('should trim the tag', async function () {
		const kiosk = await KioskModel.create({
			...testKioskField,
			kioskTag: '  12346  '
		})
		expect(kiosk).to.exist
		expect(kiosk.kioskTag).to.equal('12346')
	})

	it('should not create a kiosk with the same tag', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create(testKioskField)
			await KioskModel.create(testKioskField)
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a kiosk with a tag that is more than 5 characters long', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create({
				...testKioskField,
				kioskTag: '123456'
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a kiosk with a tag that is less than 5 characters long', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create({
				...testKioskField,
				kioskTag: '1234'
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a kiosk with a tag that is not a number', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create({
				...testKioskField,
				kioskTag: '1234a'
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a kiosk with an activity that does not exist', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create({
				...testKioskField,
				priorityActivities: [testActivity1.id, new mongoose.Types.ObjectId()]
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not save a kiosk without a name', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create({
				...testKioskField,
				name: undefined
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not save a kiosk with a reader that does not exist', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create({
				...testKioskField,
				readerId: new mongoose.Types.ObjectId()
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should save a kiosk without a reader', async function () {
		const kiosk = await KioskModel.create({
			...testKioskField,
			readerId: undefined
		})
		expect(kiosk).to.exist
	})

	it('should save a kiosk without priorityActivities', async function () {
		const kiosk = await KioskModel.create({
			...testKioskField,
			priorityActivities: undefined
		})
		expect(kiosk).to.exist
	})

	it('should not save a kiosk with a reader that is used by another kiosk', async function () {
		let errorOccurred = false
		const reader = await ReaderModel.create({
			apiReferenceId: '12346',
			readerTag: '12346'
		})
		await KioskModel.create({
			readerId: reader.id,
			name: 'Test Kiosk 2'
		})
		try {
			await KioskModel.create({
				...testKioskField,
				readerId: reader.id
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should generate a new kiosk tag', async function () {
		const kiosk = await KioskModel.create(testKioskField)
		const oldKioskTag = kiosk.kioskTag
		const newKioskTag = await kiosk.generateNewKioskTag()
		expect(newKioskTag).to.exist
		expect(kiosk.kioskTag).to.not.equal(oldKioskTag)
	})

	it('should not generate a kiosk tag that already exists', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create(testKioskField)
			await KioskModel.create(testKioskField)
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not generate a kiosk tag that is more than 5 characters long', async function () {
		const kiosk = await KioskModel.create(testKioskField)
		const oldKioskTag = kiosk.kioskTag
		await kiosk.generateNewKioskTag()
		expect(kiosk.kioskTag).to.not.equal(oldKioskTag)
		expect(kiosk.kioskTag.length).to.equal(5)
	})

	it('should generate a kiosk tag by default', async function () {
		const kiosk = await KioskModel.create({
			...testKioskField,
			kioskTag: undefined
		})
		expect(kiosk.kioskTag).to.exist
	})

	it('should not create a kiosk with a non existing activity', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create({
				...testKioskField,
				priorityActivities: [new mongoose.Types.ObjectId()]
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a kiosk with a valid activity and a non-existing activity', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create({
				...testKioskField,
				priorityActivities: [testActivity1.id, new mongoose.Types.ObjectId()]
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})
})
