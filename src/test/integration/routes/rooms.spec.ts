// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose from 'mongoose'

// Own modules
import RoomModel, { type IRoom } from '../../../app/models/Room.js'
import { chaiAppServer as agent } from '../../testSetup.js'

describe('POST /v1/rooms', function () {
	const testRoomFields1 = {
		name: 'Room 1',
		description: 'Description for Room 1'
	}

	it('should create a new room', async function () {
		await agent.post('/v1/rooms').send(testRoomFields1)

		const room = await RoomModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(room).to.exist
		expect(room).to.have.property('name', testRoomFields1.name)
		expect(room).to.have.property('description', testRoomFields1.description)
	})

	it('should return the newly created object', async function () {
		const response = await agent.post('/v1/rooms').send(testRoomFields1)

		expect(response).to.have.status(201)
		expect(response.body).to.have.property('name', testRoomFields1.name)
		expect(response.body).to.have.property('description', testRoomFields1.description)
	})

	it('should not allow setting the _id', async function () {
		const newId = new mongoose.Types.ObjectId().toString()
		const updatedFields = {
			_id: newId
		}

		await agent.post('/v1/rooms').send(updatedFields)
		const room = await RoomModel.findOne({})
		expect(room?.id.toString()).to.not.equal(newId)
	})
})

describe('GET /v1/rooms/:id', function () {
	let testRoom1: IRoom

	const testRoomFields1 = {
		name: 'Room 1',
		description: 'Description for Room 1'
	}

	const testRoomFields2 = {
		name: 'Room 2',
		description: 'Description for Room 2'
	}

	beforeEach(async function () {
		testRoom1 = await RoomModel.create(testRoomFields1)
		await RoomModel.create(testRoomFields2)
	})

	it('should return a room', async function () {
		const response = await agent.get(`/v1/rooms/${testRoom1.id}`)

		expect(response).to.have.status(200)
		expect(response.body).to.have.property('name', testRoomFields1.name)
		expect(response.body).to.have.property('description', testRoomFields1.description)
	})

	it('should return 404 if the room does not exist', async function () {
		const response = await agent.get(`/v1/rooms/${new mongoose.Types.ObjectId().toString()}`)

		expect(response).to.have.status(404)
	})
})

describe('GET /v1/rooms', function () {
	const testRoomFields1 = {
		name: 'Room 1',
		description: 'Description for Room 1'
	}

	const testRoomFields2 = {
		name: 'Room 2',
		description: 'Description for Room 2'
	}

	beforeEach(async function () {
		await RoomModel.create(testRoomFields1)
		await RoomModel.create(testRoomFields2)
	})

	it('should return all rooms', async function () {
		const response = await agent.get('/v1/rooms')

		expect(response).to.have.status(200)
		expect(response.body).to.be.an('array')
		expect(response.body).to.have.lengthOf(2)
	})
})

describe('PATCH /v1/rooms/:id', function () {
	let testRoom1: IRoom

	const testRoomFields1 = {
		name: 'Room 1',
		description: 'Description for Room 1'
	}

	const testRoomFields2 = {
		name: 'Room 2',
		description: 'Description for Room 2'
	}

	beforeEach(async function () {
		testRoom1 = await RoomModel.create(testRoomFields1)
		await RoomModel.create(testRoomFields2)
	})

	it('should update a room', async function () {
		const updatedFields = {
			name: 'Updated Room 1',
			description: 'Updated Description for Room 1'
		}

		const response = await agent.patch(`/v1/rooms/${testRoom1.id}`).send(updatedFields)

		expect(response).to.have.status(200)
		expect(response.body).to.have.property('name', updatedFields.name)
		expect(response.body).to.have.property('description', updatedFields.description)
	})

	it('should allow updating name to current name', async function () {
		const updatedFields = {
			name: testRoomFields1.name
		}

		const response = await agent.patch(`/v1/rooms/${testRoom1.id}`).send(updatedFields)

		expect(response).to.have.status(200)
		expect(response.body).to.have.property('name', updatedFields.name)
		expect(response.body).to.have.property('description', testRoomFields1.description)
	})

	it('should not allow updating the _id', async function () {
		const updatedFields = {
			_id: new mongoose.Types.ObjectId().toString()
		}

		await agent.patch(`/v1/rooms/${testRoom1.id}`).send(updatedFields)
		const room = await RoomModel.findOne({})
		expect(room?.id.toString()).to.equal(testRoom1.id)
	})

	it('should return 404 if the room does not exist', async function () {
		const updatedFields = {
			name: 'Updated Room 1',
			description: 'Updated Description for Room 1'
		}

		const response = await agent.patch(`/v1/rooms/${new mongoose.Types.ObjectId().toString()}`).send(updatedFields)

		expect(response).to.have.status(404)
	})
})

describe('DELETE /v1/rooms/:id', function () {
	let testRoom1: IRoom

	const testRoomFields1 = {
		name: 'Room 1',
		description: 'Description for Room 1'
	}

	const testRoomFields2 = {
		name: 'Room 2',
		description: 'Description for Room 2'
	}

	beforeEach(async function () {
		testRoom1 = await RoomModel.create(testRoomFields1)
		await RoomModel.create(testRoomFields2)
	})

	it('should delete a room', async function () {
		const response = await agent.delete(`/v1/rooms/${testRoom1.id}`).send({ confirm: true })

		expect(response).to.have.status(204)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body).to.be.empty
		const product = await RoomModel.findById(testRoom1.id)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(product).to.not.exist
	})

	it('should return 404 if the room does not exist', async function () {
		const response = await agent.delete(`/v1/rooms/${new mongoose.Types.ObjectId().toString()}`).send({ confirm: true })

		expect(response).to.have.status(404)
	})

	it('should return an error if confirm false', async function () {
		const response = await agent.delete(`/v1/rooms/${testRoom1.id}`).send({ confirm: false })

		expect(response).to.have.status(400)
		expect(response.body).to.have.property('error')
	})

	it('should return an error if confirm not sent', async function () {
		const response = await agent.delete(`/v1/rooms/${testRoom1.id}`)

		expect(response).to.have.status(400)
		expect(response.body).to.have.property('error')
	})

	it('should return an error if confirm not boolean', async function () {
		const response = await agent.delete(`/v1/rooms/${testRoom1.id}`).send({ confirm: 'true' })

		expect(response).to.have.status(400)
		expect(response.body).to.have.property('error')
	})
})
