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
import ActivityModel, { IActivity, IActivityPopulated } from '../../../app/models/Activity.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'

// Setup test environment
import '../../testSetup.js'
import KioskModel from '../../../app/models/Kiosk.js'
import mongoose, { PopulatedDoc } from 'mongoose'

describe('Activity Model', function () {
	let testRoom: IRoom
	let testActivityField: {
		name: string
		rooms: string[]
	}

	beforeEach(async function () {
		testRoom = await RoomModel.create({
			name: 'Room 1',
			description: 'Description for Room 1'
		})

		testActivityField = {
			name: 'Activity 1',
			rooms: [testRoom.id.toString()]
		}
	})

	it('should create a valid activity', async function () {
		const activity = await ActivityModel.create(testActivityField)
		expect(activity).to.exist
		expect(activity.name).to.equal(testActivityField.name)
		const populatedActivity = await activity?.populate('rooms') as IActivityPopulated
		expect(populatedActivity?.rooms).to.be.an('array')
		expect(populatedActivity?.rooms[0].id).to.equal(testActivityField.rooms[0])
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

	it('should create an activity without any rooms', async function () {
		const activity = await ActivityModel.create({
			...testActivityField,
			rooms: undefined
		})
		expect(activity).to.exist
	})

	it('should default to an empty array when creating an activity without any rooms', async function () {
		const activity = await ActivityModel.create({
			...testActivityField,
			rooms: undefined
		})
		expect(activity.rooms).to.be.an('array').that.has.lengthOf(0)
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

	it('should not create an activity with a non-existing roomId in rooms', async function () {
		let errorOccurred = false
		try {
			await ActivityModel.create({
				...testActivityField,
				rooms: [new mongoose.Types.ObjectId().toString()]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})
})
