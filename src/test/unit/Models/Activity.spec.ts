/* eslint-disable typescript/no-unused-vars */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'

// Own modules
import ActivityModel from '../../../app/models/Activity.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'

// Setup test environment
import '../../testSetup.js'
import KioskModel from '../../../app/models/Kiosk.js'
import mongoose from 'mongoose'

describe('Activity Model', function () {
	let testRoom: IRoom
	let testActivityField: {
		name: string
		roomId: string
	}

	beforeEach(async function () {
		testRoom = await RoomModel.create({
			name: 'Room 1',
			description: 'Description for Room 1'
		})

		testActivityField = {
			name: 'Activity 1',
			roomId: testRoom.id.toString()
		}
	})

	it('should create a valid activity', async function () {
		const activity = await ActivityModel.create(testActivityField)
		expect(activity).to.exist
		expect(activity.name).to.equal(testActivityField.name)
		const populatedActivity = await activity?.populate('roomId')
		expect(populatedActivity?.roomId).to.have.property('id', testActivityField.roomId)
	})

	it('should trim the name', async function () {
		const activity = await ActivityModel.create({
			...testActivityField,
			name: '  TestActivity  '
		})
		expect(activity).to.exist
		expect(activity.name).to.equal('TestActivity')
	})

	it('should not create an activity with the same name', async function () {
		let errorOccurred = false
		try {
			await ActivityModel.create(testActivityField)
			await ActivityModel.create(testActivityField)
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create an activity without a name', async function () {
		let errorOccurred = false
		try {
			await ActivityModel.create({
				...testActivityField,
				name: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should create an activity without a roomId', async function () {
		const activity = await ActivityModel.create({
			...testActivityField,
			roomId: undefined
		})
		expect(activity).to.exist
	})

	it('should remove the activity from any kiosks when deleted', async function () {
		const activity = await ActivityModel.create(testActivityField)
		const kiosk = await KioskModel.create({
			name: 'TestKiosk',
			activities: [activity._id],
			password: 'TestPassword'
		})

		await ActivityModel.deleteOne({ _id: activity._id })

		const updatedKiosk = await KioskModel.findById(kiosk._id)
		expect(updatedKiosk?.activities).to.be.empty
	})

	it('should not create an activity with a non-existing roomId', async function () {
		let errorOccurred = false
		try {
			await ActivityModel.create({
				...testActivityField,
				roomId: new mongoose.Types.ObjectId().toString()
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})
})
