// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'

// Own modules
import RoomModel from '../../app/models/Room.js'

// Setup test environment
import '../testSetup.js'

describe('Room Model', function () {
	const testRoomField = {
		name: 'TestRoom',
		number: 1,
		description: 'TestDescription'
	}

	it('should create a valid room', async function () {
		const room = await RoomModel.create(testRoomField)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(room).to.exist
		expect(room.name).to.equal(testRoomField.name)
		expect(room.number).to.equal(testRoomField.number)
		expect(room.description).to.equal(testRoomField.description)
	})

	it('should trim the name', async function () {
		const room = await RoomModel.create({
			...testRoomField,
			name: '  TestRoom  '
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(room).to.exist
		expect(room.name).to.equal('TestRoom')
	})

	it('should trim the description', async function () {
		const room = await RoomModel.create({
			...testRoomField,
			description: '  TestDescription  '
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(room).to.exist
		expect(room.description).to.equal('TestDescription')
	})

	it('should not create a room with the same number', async function () {
		let errorOccurred = false
		try {
			await RoomModel.create(testRoomField)
			await RoomModel.create(testRoomField)
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a room without a number', async function () {
		let errorOccurred = false
		try {
			await RoomModel.create({
				...testRoomField,
				number: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a room with a negative number', async function () {
		let errorOccurred = false
		try {
			await RoomModel.create({
				...testRoomField,
				number: -1
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})
})
