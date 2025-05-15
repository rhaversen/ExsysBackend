/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose from 'mongoose'

import ActivityModel from '../../../app/models/Activity.js'
import KioskModel from '../../../app/models/Kiosk.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'

import '../../testSetup.js'

describe('Activity Model', function () {
	let testRoom: IRoom
	let testActivityField: {
		name: string
		priorityRooms: string[]
	}

	beforeEach(async function () {
		testRoom = await RoomModel.create({
			name: 'Room 1',
			description: 'Description for Room 1'
		})

		testActivityField = {
			name: 'Activity 1',
			priorityRooms: [testRoom.id.toString()]
		}
	})

	it('should create a valid activity', async function () {
		const activity = await ActivityModel.create(testActivityField)
		expect(activity).to.exist
		expect(activity.name).to.equal(testActivityField.name)
		expect(activity.priorityRooms).to.be.an('array')
		expect(activity?.priorityRooms[0].toString()).to.equal(testActivityField.priorityRooms[0])
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
		} catch {
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
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should create an activity without any priorityRooms', async function () {
		const activity = await ActivityModel.create({
			...testActivityField,
			priorityRooms: undefined
		})
		expect(activity).to.exist
	})

	it('should default to an empty array when creating an activity without any priorityRooms', async function () {
		const activity = await ActivityModel.create({
			...testActivityField,
			priorityRooms: undefined
		})
		expect(activity.priorityRooms).to.be.an('array').that.has.lengthOf(0)
	})

	it('should remove the activity from any kiosks priorityActivities field when deleted', async function () {
		const activity = await ActivityModel.create(testActivityField)
		const kiosk = await KioskModel.create({
			name: 'TestKiosk',
			priorityActivities: [activity._id],
			kioskTag: '11111'
		})

		await ActivityModel.deleteOne({ _id: activity._id })

		const updatedKiosk = await KioskModel.findById(kiosk._id)
		expect(updatedKiosk?.priorityActivities).to.be.empty
	})

	it('should remove the activity from any kiosks disabledActivities field when deleted', async function () {
		const activity = await ActivityModel.create(testActivityField)
		const kiosk = await KioskModel.create({
			name: 'TestKiosk2',
			disabledActivities: [activity._id],
			kioskTag: '22222'
		})

		await ActivityModel.deleteOne({ _id: activity._id })

		const updatedKiosk = await KioskModel.findById(kiosk._id)
		expect(updatedKiosk?.disabledActivities).to.be.empty
	})

	it('should not remove other priorityActivities when deleting one', async function () {
		const activity1 = await ActivityModel.create(testActivityField)
		const activity2 = await ActivityModel.create({ ...testActivityField, name: 'Activity 2' })
		const kiosk = await KioskModel.create({
			name: 'TestKiosk3',
			priorityActivities: [activity1._id, activity2._id],
			disabledActivities: [activity1._id, activity2._id],
			kioskTag: '33333'
		})

		await ActivityModel.deleteOne({ _id: activity1._id })

		const updatedKiosk = await KioskModel.findById(kiosk._id)
		expect(updatedKiosk?.priorityActivities).to.have.lengthOf(1)
		expect(updatedKiosk?.priorityActivities?.[0].toString()).to.equal(activity2._id.toString())
		expect(updatedKiosk?.disabledActivities).to.have.lengthOf(1)
		expect(updatedKiosk?.disabledActivities?.[0].toString()).to.equal(activity2._id.toString())
	})

	it('should not create an activity with a non-existing roomId in priorityRooms', async function () {
		let errorOccurred = false
		try {
			await ActivityModel.create({
				...testActivityField,
				priorityRooms: [new mongoose.Types.ObjectId().toString()]
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})
})
