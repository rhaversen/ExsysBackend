/* eslint-disable typescript/no-unused-vars */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'

// Own modules
import RoomModel from '../../../app/models/Room.js'

// Setup test environment
import '../../testSetup.js'
import ActivityModel from '../../../app/models/Activity.js'

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
		} catch (err) {
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
		} catch (err) {
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
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should remove the room from any activities when deleted', async function () {
		const room = await RoomModel.create(testRoomField)
		const activity = await ActivityModel.create({
			name: 'TestActivity',
			roomId: room._id
		})

		await RoomModel.findByIdAndDelete(room._id)

		const updatedActivity = await ActivityModel.findById(activity._id)
		expect(updatedActivity?.roomId).to.be.undefined
	})
})
