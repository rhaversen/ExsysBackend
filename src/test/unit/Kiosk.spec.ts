/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose from 'mongoose'

// Own modules
import KioskModel from '../../app/models/Kiosk.js'
import ActivityModel, { type IActivity } from '../../app/models/Activity.js'

// Setup test environment
import '../testSetup.js'
import RoomModel from '../../app/models/Room.js'

describe('Kiosk Model', function () {
	let testActivity1: IActivity
	let testActivity2: IActivity
	let testKioskField: {
		kioskTag: string
		activities: string[]
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

		testKioskField = {
			kioskTag: '12345',
			activities: [testActivity1.id, testActivity2.id]
		}
	})

	it('should create a valid kiosk', async function () {
		const kiosk = await KioskModel.create(testKioskField)
		expect(kiosk).to.exist
		expect(kiosk.kioskTag).to.equal(testKioskField.kioskTag)
		const populatedKiosk = await kiosk?.populate('activities')
		expect(populatedKiosk?.activities[0]).to.have.property('id', testKioskField.activities[0])
	})

	it('should trim the tag', async function () {
		const kiosk = await KioskModel.create({
			...testKioskField,
			kioskTag: '  12345  '
		})
		expect(kiosk).to.exist
		expect(kiosk.kioskTag).to.equal('12345')
	})

	it('should not create a kiosk with the same tag', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create(testKioskField)
			await KioskModel.create(testKioskField)
		} catch (err) {
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
		} catch (err) {
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
		} catch (err) {
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
		} catch (err) {
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
				activities: [testActivity1.id, new mongoose.Types.ObjectId()]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should generate a new kiosk tag', async function () {
		const kiosk = await KioskModel.create(testKioskField)
		const oldKioskTag = kiosk.kioskTag
		await kiosk.generateNewKioskTag()
		expect(kiosk.kioskTag).to.not.equal(oldKioskTag)
	})

	it('should not generate a kiosk tag that already exists', async function () {
		let errorOccurred = false
		try {
			await KioskModel.create(testKioskField)
			await KioskModel.create(testKioskField)
		} catch (err) {
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
			activities: [testActivity1.id, testActivity2.id]
		})
		expect(kiosk.kioskTag).to.exist
	})
})
