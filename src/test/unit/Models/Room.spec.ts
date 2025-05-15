/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'

import ActivityModel, { IActivity } from '../../../app/models/Activity.js'
import RoomModel, { IRoom } from '../../../app/models/Room.js'

import '../../testSetup.js'

describe('Room Model', function () {
	const testRoomField = {
		name: 'TestRoom',
		description: 'TestDescription'
	}

	it('should create a valid room', async function () {
		const room = await RoomModel.create(testRoomField)
		expect(room).to.exist
		expect(room.name).to.equal(testRoomField.name)
		expect(room.description).to.equal(testRoomField.description)
	})

	it('should trim the name', async function () {
		const room = await RoomModel.create({
			...testRoomField,
			name: '  TestRoom  '
		})
		expect(room).to.exist
		expect(room.name).to.equal('TestRoom')
	})

	it('should trim the description', async function () {
		const room = await RoomModel.create({
			...testRoomField,
			description: '  TestDescription  '
		})
		expect(room).to.exist
		expect(room.description).to.equal('TestDescription')
	})

	it('should not create a room with the same name', async function () {
		let errorOccurred = false
		try {
			await RoomModel.create(testRoomField)
			await RoomModel.create(testRoomField)
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a room without a name', async function () {
		let errorOccurred = false
		try {
			await RoomModel.create({
				...testRoomField,
				name: undefined
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a room without a description', async function () {
		let errorOccurred = false
		try {
			await RoomModel.create({
				...testRoomField,
				description: undefined
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should remove the room from any priorityActivities when deleted', async function () {
		const room = await RoomModel.create(testRoomField)
		const activity = await ActivityModel.create({
			name: 'TestActivity',
			roomId: room._id
		})

		await RoomModel.findByIdAndDelete(room._id)

		const updatedActivity = await ActivityModel.findById(activity._id)
		expect(updatedActivity?.priorityRooms).to.be.an('array').that.is.empty
	})

	describe('Delete middleware', function () {
		let room1: IRoom, room2: IRoom, room3: IRoom
		let activity1: IActivity, activity2: IActivity

		beforeEach(async function () {
			room1 = await RoomModel.create({ name: 'RoomToDelete1', description: 'Desc1' })
			room2 = await RoomModel.create({ name: 'RoomToDelete2', description: 'Desc2' })
			room3 = await RoomModel.create({ name: 'RoomToKeep', description: 'DescKeep' })

			activity1 = await ActivityModel.create({
				name: 'Activity1',
				priorityRooms: [room1._id, room3._id],
				disabledRooms: [room1._id, room3._id]
			})
			activity2 = await ActivityModel.create({
				name: 'Activity2',
				priorityRooms: [room2._id],
				disabledRooms: [room2._id]
			})
		})

		describe('Pre-delete middleware (deleteOne / findOneAndDelete)', function () {
			it('should remove the room from Activity.priorityRooms when deleted', async function () {
				await RoomModel.deleteOne({ _id: room1._id })

				const updatedActivity1 = await ActivityModel.findById(activity1._id)
				expect(updatedActivity1?.priorityRooms).to.have.lengthOf(1)
				expect(updatedActivity1?.priorityRooms?.[0].toString()).to.equal(room3._id.toString())
			})

			it('should remove the room from Activity.disabledRooms when deleted', async function () {
				await RoomModel.deleteOne({ _id: room1._id })

				const updatedActivity1 = await ActivityModel.findById(activity1._id)
				expect(updatedActivity1?.disabledRooms).to.have.lengthOf(1)
				expect(updatedActivity1?.disabledRooms?.[0].toString()).to.equal(room3._id.toString())
			})

			it('should not affect other priorityActivities when deleting a room', async function () {
				await RoomModel.deleteOne({ _id: room1._id })

				const updatedActivity2 = await ActivityModel.findById(activity2._id)
				expect(updatedActivity2?.priorityRooms).to.have.lengthOf(1)
				expect(updatedActivity2?.priorityRooms?.[0].toString()).to.equal(room2._id.toString())
				expect(updatedActivity2?.disabledRooms).to.have.lengthOf(1)
				expect(updatedActivity2?.disabledRooms?.[0].toString()).to.equal(room2._id.toString())
			})
		})

		describe('Pre-delete-many middleware', function () {
			it('should remove the priorityRooms from Activity.priorityRooms when deleted via deleteMany', async function () {
				await RoomModel.deleteMany({ _id: { $in: [room1._id, room2._id] } })

				const updatedActivity1 = await ActivityModel.findById(activity1._id)
				const updatedActivity2 = await ActivityModel.findById(activity2._id)

				expect(updatedActivity1?.priorityRooms).to.have.lengthOf(1)
				expect(updatedActivity1?.priorityRooms?.[0].toString()).to.equal(room3._id.toString())
				expect(updatedActivity2?.priorityRooms).to.be.empty
			})

			it('should remove the priorityRooms from Activity.disabledRooms when deleted via deleteMany', async function () {
				await RoomModel.deleteMany({ _id: { $in: [room1._id, room2._id] } })

				const updatedActivity1 = await ActivityModel.findById(activity1._id)
				const updatedActivity2 = await ActivityModel.findById(activity2._id)

				expect(updatedActivity1?.disabledRooms).to.have.lengthOf(1)
				expect(updatedActivity1?.disabledRooms?.[0].toString()).to.equal(room3._id.toString())
				expect(updatedActivity2?.disabledRooms).to.be.empty
			})

			it('should not affect priorityActivities not referencing the deleted priorityRooms via deleteMany', async function () {
				const activity3 = await ActivityModel.create({ name: 'Activity3', priorityRooms: [room3._id], disabledRooms: [room3._id] })
				await RoomModel.deleteMany({ _id: { $in: [room1._id, room2._id] } })

				const updatedActivity3 = await ActivityModel.findById(activity3._id)
				expect(updatedActivity3?.priorityRooms).to.have.lengthOf(1)
				expect(updatedActivity3?.priorityRooms?.[0].toString()).to.equal(room3._id.toString())
				expect(updatedActivity3?.disabledRooms).to.have.lengthOf(1)
				expect(updatedActivity3?.disabledRooms?.[0].toString()).to.equal(room3._id.toString())
			})
		})
	})
})
