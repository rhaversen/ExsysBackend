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
import ActivityModel, { type IActivity } from '../../../app/models/Activity.js'
import { chaiAppServer as agent } from '../../testSetup.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'

describe('POST /v1/activities', function () {
	let testRoom: IRoom
	let testActivityFields1: {
		name: string
		roomId: string
	}

	beforeEach(async function () {
		testRoom = await RoomModel.create({
			name: 'Room 1',
			description: 'Description for Room 1'
		})

		testActivityFields1 = {
			name: 'Activity 1',
			roomId: testRoom.id.toString()
		}
	})

	it('should create a new activity', async function () {
		await agent.post('/v1/activities').send(testActivityFields1)

		const activity = await ActivityModel.findOne({})

		expect(activity).to.exist
		expect(activity).to.have.property('name', testActivityFields1.name)
		const populatedActivity = await activity?.populate('roomId')
		expect(populatedActivity?.roomId).to.have.property('id', testActivityFields1.roomId)
	})

	it('should return the newly created object', async function () {
		const response = await agent.post('/v1/activities').send(testActivityFields1)

		expect(response).to.have.status(201)
		expect(response.body).to.have.property('name', testActivityFields1.name)
		expect(response.body).to.have.property('roomId', testActivityFields1.roomId)
	})

	it('should not allow setting the _id', async function () {
		const newId = new mongoose.Types.ObjectId().toString()
		const updatedFields = {
			_id: newId
		}

		await agent.post('/v1/activities').send(updatedFields)
		const activity = await ActivityModel.findOne({})
		expect(activity?.id.toString()).to.not.equal(newId)
	})
})

describe('GET /v1/activities/:id', function () {
	let testActivity1: IActivity
	let testActivityFields1: {
		name: string
		roomId: mongoose.Types.ObjectId
	}

	beforeEach(async function () {
		const testRoom1 = await RoomModel.create({
			name: 'Room 1',
			description: 'Description for Room 1'
		})
		const testRoom2 = await RoomModel.create({
			name: 'Room 2',
			description: 'Description for Room 2'
		})

		testActivity1 = await ActivityModel.create({
			name: 'Activity 1',
			roomId: testRoom1.id
		})
		testActivityFields1 = {
			name: 'Activity 1',
			roomId: testRoom1.id
		}
		await ActivityModel.create({
			name: 'Activity 2',
			roomId: testRoom2.id
		})
	})

	it('should return an activity', async function () {
		const response = await agent.get(`/v1/activities/${testActivity1.id}`)

		expect(response).to.have.status(200)
		expect(response.body).to.have.property('name', testActivityFields1.name)
		expect(response.body).to.have.property('roomId', testActivityFields1.roomId)
	})

	it('should return 404 if the activity does not exist', async function () {
		const response = await agent.get(`/v1/activities/${new mongoose.Types.ObjectId().toString()}`)

		expect(response).to.have.status(404)
	})
})

describe('GET /v1/activities', function () {
	let testActivityFields1: {
		name: string
		roomId: string
	}
	let testActivityFields2: {
		name: string
		roomId: string
	}

	beforeEach(async function () {
		const testRoom1 = await RoomModel.create({
			name: 'Room 1',
			description: 'Description for Room 1'
		})
		const testRoom2 = await RoomModel.create({
			name: 'Room 2',
			description: 'Description for Room 2'
		})

		await ActivityModel.create({
			name: 'Activity 1',
			roomId: testRoom1.id
		})
		await ActivityModel.create({
			name: 'Activity 2',
			roomId: testRoom2.id
		})

		testActivityFields1 = {
			name: 'Activity 1',
			roomId: testRoom1.id.toString()
		}

		testActivityFields2 = {
			name: 'Activity 2',
			roomId: testRoom2.id.toString()
		}
	})

	it('should return all activities', async function () {
		const response = await agent.get('/v1/activities')

		expect(response).to.have.status(200)
		expect(response.body).to.be.an('array')
		expect(response.body).to.have.lengthOf(2)
		expect(response.body.map((activity: IActivity) => activity.name)).to.have.members(['Activity 1', 'Activity 2'])
		expect(response.body.map((activity: IActivity) => activity.roomId)).to.have.members([testActivityFields1.roomId, testActivityFields2.roomId])
	})
})

describe('PATCH /v1/activities/:id', function () {
	let testActivity1: IActivity
	let testActivityFields1: {
		name: string
		roomId: string
	}

	beforeEach(async function () {
		const testRoom1 = await RoomModel.create({
			name: 'Room 1',
			description: 'Description for Room 1'
		})
		testActivity1 = await ActivityModel.create({
			name: 'Activity 1',
			roomId: testRoom1.id
		})
		testActivityFields1 = {
			name: 'Activity 1',
			roomId: testRoom1.id.toString()
		}
	})

	it('should have status 200', async function () {
		const updatedFields = {
			name: 'Updated Activity 1',
			roomId: testActivityFields1.roomId
		}

		const response = await agent.patch(`/v1/activities/${testActivity1.id}`).send(updatedFields)

		expect(response).to.have.status(200)
	})

	it('should update the activity', async function () {
		const testRoom2 = await RoomModel.create({
			name: 'Room 2',
			description: 'Description for Room 2'
		})
		const updatedFields = {
			name: 'Updated Activity 1',
			roomId: testRoom2.id
		}

		await agent.patch(`/v1/activities/${testActivity1.id}`).send(updatedFields)
		const activity = await ActivityModel.findById(testActivity1.id)
		expect(activity).to.have.property('name', updatedFields.name)
		const populatedActivity = await activity?.populate('roomId')
		expect(populatedActivity?.roomId).to.have.property('id', updatedFields.roomId)
	})

	it('should return the updated activity', async function () {
		const testRoom2 = await RoomModel.create({
			name: 'Room 2',
			description: 'Description for Room 2'
		})
		const updatedFields = {
			name: 'Updated Activity 1',
			roomId: testRoom2.id
		}

		const response = await agent.patch(`/v1/activities/${testActivity1.id}`).send(updatedFields)

		expect(response.body).to.have.property('name', updatedFields.name)
		expect(response.body).to.have.property('roomId', updatedFields.roomId)
	})

	it('should allow updating name to current name', async function () {
		const updatedFields = {
			name: 'Activity 1'
		}
		const response = await agent.patch(`/v1/activities/${testActivity1.id}`).send(updatedFields)

		expect(response).to.have.status(200)
		expect(response.body).to.have.property('name', updatedFields.name)
		expect(response.body).to.have.property('roomId', testActivityFields1.roomId)
	})

	it('should allow updating roomId to current roomId', async function () {
		const updatedFields = {
			name: 'Updated Activity 1',
			roomId: testActivityFields1.roomId
		}
		const response = await agent.patch(`/v1/activities/${testActivity1.id}`).send(updatedFields)

		expect(response).to.have.status(200)
		expect(response.body).to.have.property('name', updatedFields.name)
		expect(response.body).to.have.property('roomId', testActivityFields1.roomId)
	})

	it('should allow a partial update', async function () {
		const updatedFields = {
			name: 'Updated Activity 1'
		}

		await agent.patch(`/v1/activities/${testActivity1.id}`).send(updatedFields)
		const activity = await ActivityModel.findById(testActivity1.id)
		expect(activity).to.have.property('name', updatedFields.name)
	})

	it('should not update other fields', async function () {
		const updatedFields = {
			name: 'Updated Activity 1'
		}

		await agent.patch(`/v1/activities/${testActivity1.id}`).send(updatedFields)
		const activity = await ActivityModel.findById(testActivity1.id)
		const populatedActivity = await activity?.populate('roomId')
		expect(populatedActivity?.roomId).to.have.property('id', testActivityFields1.roomId)
	})

	it('should not update other activities', async function () {
		const testRoom2 = await RoomModel.create({
			name: 'Room 2',
			description: 'Description for Room 2'
		})
		const testActivity2 = await ActivityModel.create({
			name: 'Activity 2',
			roomId: testRoom2.id
		})

		const updatedFields = {
			name: 'Updated Activity 1',
			roomId: testRoom2.id
		}

		await agent.patch(`/v1/activities/${testActivity1.id}`).send(updatedFields)
		const activity = await ActivityModel.findById(testActivity2.id)
		expect(activity).to.have.property('name', 'Activity 2')
		const populatedActivity = await activity?.populate('roomId')
		expect(populatedActivity?.roomId).to.have.property('id', testRoom2.id)
	})

	it('should not allow updating the _id', async function () {
		const updatedFields = {
			_id: new mongoose.Types.ObjectId().toString()
		}

		await agent.patch(`/v1/activities/${testActivity1.id}`).send(updatedFields)
		const activity = await ActivityModel.findOne({})
		expect(activity?.id.toString()).to.equal(testActivity1.id)
	})

	it('should return 404 if the activity does not exist', async function () {
		const updatedFields = {
			name: 'Updated Activity 1',
			description: 'Updated Description for Activity 1'
		}

		const response = await agent.patch(`/v1/activities/${new mongoose.Types.ObjectId().toString()}`).send(updatedFields)

		expect(response).to.have.status(404)
	})
})

describe('DELETE /v1/activities/:id', function () {
	let testActivity1: IActivity

	beforeEach(async function () {
		const testRoom1 = await RoomModel.create({
			name: 'Room 1',
			description: 'Description for Room 1'
		})
		testActivity1 = await ActivityModel.create({
			name: 'Activity 1',
			roomId: testRoom1.id
		})
	})

	it('should delete an activity', async function () {
		const response = await agent.delete(`/v1/activities/${testActivity1.id}`).send({ confirm: true })

		expect(response).to.have.status(204)

		expect(response.body).to.be.empty
		const product = await ActivityModel.findById(testActivity1.id)

		expect(product).to.not.exist
	})

	it('should not delete other activities', async function () {
		const testRoom2 = await RoomModel.create({
			name: 'Room 2',
			description: 'Description for Room 2'
		})
		const testActivity2 = await ActivityModel.create({
			name: 'Activity 2',
			roomId: testRoom2.id
		})

		await agent.delete(`/v1/activities/${testActivity1.id}`).send({ confirm: true })
		const product = await ActivityModel.findById(testActivity2.id)

		expect(product).to.exist
	})

	it('should return 404 if the activity does not exist', async function () {
		const response = await agent.delete(`/v1/activities/${new mongoose.Types.ObjectId().toString()}`).send({ confirm: true })

		expect(response).to.have.status(404)
	})

	it('should return an error if confirm false', async function () {
		const response = await agent.delete(`/v1/activities/${testActivity1.id}`).send({ confirm: false })

		expect(response).to.have.status(400)
		expect(response.body).to.have.property('error')
	})

	it('should return an error if confirm not sent', async function () {
		const response = await agent.delete(`/v1/activities/${testActivity1.id}`)

		expect(response).to.have.status(400)
		expect(response.body).to.have.property('error')
	})

	it('should return an error if confirm not boolean', async function () {
		const response = await agent.delete(`/v1/activities/${testActivity1.id}`).send({ confirm: 'true' })

		expect(response).to.have.status(400)
		expect(response.body).to.have.property('error')
	})
})
