/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose from 'mongoose'

import ActivityModel, { IActivityPopulated, type IActivity } from '../../../app/models/Activity.js'
import AdminModel from '../../../app/models/Admin.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'
import { getChaiAgent as agent, extractConnectSid } from '../../testSetup.js'

describe('Activities routes', function () {
	let sessionCookie: string

	beforeEach(async function () {
		// Log the agent in to get a valid session
		const adminFields = {
			name: 'Agent Admin',
			password: 'agentPassword'
		}
		await AdminModel.create(adminFields)

		const response = await agent().post('/api/v1/auth/login-admin-local').send(adminFields)
		sessionCookie = extractConnectSid(response.headers['set-cookie'])
	})

	describe('POST /v1/activities', function () {
		let testRoom: IRoom
		let testActivityFields1: {
			name: string
			priorityRooms: string[]
		}

		beforeEach(async function () {
			testRoom = await RoomModel.create({
				name: 'Room 1',
				description: 'Description for Room 1'
			})
			// For a single room, use an array with one element
			testActivityFields1 = {
				name: 'Activity 1',
				priorityRooms: [testRoom.id.toString()]
			}
		})

		it('should have status 201 for a single room', async function () {
			const response = await agent().post('/api/v1/activities').send(testActivityFields1).set('Cookie', sessionCookie)
			expect(response).to.have.status(201)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().post('/api/v1/activities').send(testActivityFields1)

			expect(response).to.have.status(403)
		})

		it('should create a new activity with a single room', async function () {
			await agent().post('/api/v1/activities').send(testActivityFields1).set('Cookie', sessionCookie)

			const activity = await ActivityModel.findOne({})

			expect(activity).to.exist
			expect(activity).to.have.property('name', testActivityFields1.name)
			// Expect priorityRooms to be an array and populate its first element
			const populatedActivity = await activity?.populate('priorityRooms')
			expect(populatedActivity?.priorityRooms).to.be.an('array')
			expect(populatedActivity?.priorityRooms[0]).to.have.property('id', testActivityFields1.priorityRooms[0])
			expect(activity).to.have.property('createdAt')
			expect(activity).to.have.property('updatedAt')
		})

		it('should return the newly created object with populated priorityRooms', async function () {
			const response = await agent().post('/api/v1/activities').send(testActivityFields1).set('Cookie', sessionCookie)

			expect(response).to.have.status(201)
			expect(response.body).to.have.property('name', testActivityFields1.name)
			expect(response.body.priorityRooms[0]).to.have.property('_id', testActivityFields1.priorityRooms[0])
		})

		it('should populate the priorityRooms', async function () {
			const response = await agent().post('/api/v1/activities').send(testActivityFields1).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('priorityRooms')
			expect(response.body.priorityRooms).to.be.an('array')
			expect(response.body.priorityRooms[0]).to.have.property('name', 'Room 1')
			expect(response.body.priorityRooms[0]).to.have.property('description', 'Description for Room 1')
		})

		it('should create an activity with multiple priorityRooms', async function () {
			const secondRoom = await RoomModel.create({
				name: 'Room 2',
				description: 'Description for Room 2'
			})
			const multipleRoomsFields = {
				name: 'Activity Multiple',
				priorityRooms: [testRoom.id.toString(), secondRoom.id.toString()]
			}
			const response = await agent().post('/api/v1/activities').send(multipleRoomsFields).set('Cookie', sessionCookie)
			expect(response).to.have.status(201)
			expect(response.body.priorityRooms).to.be.an('array').that.has.lengthOf(2)
		})

		it('should throw error when creating activity with duplicate priorityRooms', async function () {
			const response = await agent().post('/api/v1/activities')
				.send({
					name: 'Duplicate Activity',
					priorityRooms: [testRoom.id.toString(), testRoom.id.toString()]
				})
				.set('Cookie', sessionCookie)
			expect(response).to.have.status(400)
		})

		it('should not allow setting the _id', async function () {
			const newId = new mongoose.Types.ObjectId().toString()
			const updatedFields = {
				_id: newId
			}

			await agent().post('/api/v1/activities').send(updatedFields).set('Cookie', sessionCookie)
			const activity = await ActivityModel.findOne({})
			expect(activity?.id.toString()).to.not.equal(newId)
		})
	})

	describe('GET /v1/activities/:id', function () {
		let testActivity1: IActivity
		let testActivityFields1: {
			name: string
			priorityRooms: string[]
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
				priorityRooms: [testRoom1.id]
			})
			testActivityFields1 = {
				name: 'Activity 1',
				priorityRooms: [testRoom1.id]
			}
			await ActivityModel.create({
				name: 'Activity 2',
				priorityRooms: [testRoom2.id]
			})
		})

		it('should have status 200', async function () {
			const response = await agent().get(`/api/v1/activities/${testActivity1.id}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should return 403 if not logged in', async function () {
			const response = await agent().get(`/api/v1/activities/${testActivity1.id}`)

			expect(response).to.have.status(403)
		})

		it('should return an activity', async function () {
			const response = await agent().get(`/api/v1/activities/${testActivity1.id}`).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('name', testActivityFields1.name)
			expect(response.body).to.have.property('priorityRooms')
			expect(response.body.priorityRooms).to.be.an('array')
			expect(response.body.priorityRooms[0]._id).to.equal(testActivityFields1.priorityRooms[0])
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
			expect(response.body).to.have.property('_id', testActivity1.id)
		})

		it('should populate the priorityRooms', async function () {
			const response = await agent().get(`/api/v1/activities/${testActivity1.id}`).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('priorityRooms')
			expect(response.body.priorityRooms).to.be.an('array')
			expect(response.body.priorityRooms[0]).to.have.property('_id', testActivityFields1.priorityRooms[0])
			expect(response.body.priorityRooms[0]).to.have.property('name', 'Room 1')
			expect(response.body.priorityRooms[0]).to.have.property('description', 'Description for Room 1')
		})

		it('should return 404 if the activity does not exist', async function () {
			const response = await agent().get(`/api/v1/activities/${new mongoose.Types.ObjectId().toString()}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
		})
	})

	describe('GET /v1/activities', function () {
		let testActivityFields1: {
			name: string
			priorityRooms: string[]
		}
		let testActivityFields2: {
			name: string
			priorityRooms: string[]
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
				priorityRooms: [testRoom1.id]
			})
			await ActivityModel.create({
				name: 'Activity 2',
				priorityRooms: [testRoom2.id]
			})

			testActivityFields1 = {
				name: 'Activity 1',
				priorityRooms: [testRoom1.id.toString()]
			}

			testActivityFields2 = {
				name: 'Activity 2',
				priorityRooms: [testRoom2.id.toString()]
			}
		})

		it('should have status 200', async function () {
			const response = await agent().get('/api/v1/activities').set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should return 403 if not logged in', async function () {
			const response = await agent().get('/api/v1/activities')

			expect(response).to.have.status(403)
		})

		it('should return all priorityActivities', async function () {
			const response = await agent().get('/api/v1/activities').set('Cookie', sessionCookie)

			expect(response.body).to.be.an('array')
			expect(response.body).to.have.lengthOf(2)
			expect(response.body.map((activity: IActivity) => activity.name))
				.to.have.members(['Activity 1', 'Activity 2'])
			expect(response.body.map((activity: {
				priorityRooms: IRoom[]
			}) => activity.priorityRooms[0]._id))
				.to.have.members([testActivityFields1.priorityRooms[0], testActivityFields2.priorityRooms[0]])
			expect(response.body.map((activity: IActivity) => activity.createdAt)).to.have.lengthOf(2)
			expect(response.body.map((activity: IActivity) => activity.updatedAt)).to.have.lengthOf(2)
		})

		it('should populate the priorityRooms', async function () {
			const response = await agent().get('/api/v1/activities').set('Cookie', sessionCookie)

			expect(response.body).to.be.an('array')
			expect(response.body).to.have.lengthOf(2)
			expect(response.body.map((activity: {
				priorityRooms: IRoom[]
			}) => activity.priorityRooms[0]._id))
				.to.have.members([testActivityFields1.priorityRooms[0], testActivityFields2.priorityRooms[0]])
			const roomNames = response.body.map((activity: { priorityRooms: { name: string }[] }) => activity.priorityRooms[0].name)
			expect(roomNames).to.have.members(['Room 1', 'Room 2'])
			const roomDescriptions = response.body.map((activity: {
				priorityRooms: { description: string }[]
			}) => activity.priorityRooms[0].description)
			expect(roomDescriptions).to.have.members(['Description for Room 1', 'Description for Room 2'])
		})
	})

	describe('PATCH /v1/activities/:id', function () {
		let testActivity1: IActivity
		let testActivityFields1: {
			name: string
			priorityRooms: string[]
		}

		beforeEach(async function () {
			const testRoom1 = await RoomModel.create({
				name: 'Room 1',
				description: 'Description for Room 1'
			})
			testActivity1 = await ActivityModel.create({
				name: 'Activity 1',
				priorityRooms: [testRoom1.id]
			})
			testActivityFields1 = {
				name: 'Activity 1',
				priorityRooms: [testRoom1.id.toString()]
			}
		})

		it('should have status 200', async function () {
			const updatedFields = {
				name: 'Updated Activity 1',
				priorityRooms: testActivityFields1.priorityRooms
			}

			const response = await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const updatedFields = {
				name: 'Updated Activity 1',
				priorityRooms: testActivityFields1.priorityRooms
			}

			const response = await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields)

			expect(response).to.have.status(403)
		})

		it('should updated the activity', async function () {
			const testRoom2 = await RoomModel.create({
				name: 'Room 2',
				description: 'Description for Room 2'
			})
			const updatedFields = {
				name: 'Updated Activity 1',
				priorityRooms: [testRoom2.id.toString()]
			}

			await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields).set('Cookie', sessionCookie)
			const activity = await ActivityModel.findById(testActivity1.id)
			expect(activity).to.have.property('name', updatedFields.name)
			const populatedActivity = await activity?.populate('priorityRooms') as IActivityPopulated
			expect(populatedActivity?.priorityRooms[0].id).to.equal(testRoom2.id.toString())
		})

		it('should return the updated activity', async function () {
			const testRoom2 = await RoomModel.create({
				name: 'Room 2',
				description: 'Description for Room 2'
			})
			const updatedFields = {
				name: 'Updated Activity 1',
				priorityRooms: [testRoom2.id.toString()]
			}

			const response = await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('name', updatedFields.name)
			expect(response.body).to.have.property('priorityRooms').that.is.an('array')
			expect(response.body.priorityRooms[0]).to.have.property('_id', testRoom2.id.toString())
		})

		it('should unset the priorityRooms when setting to null', async function () {
			const updatedFields = {
				name: 'Updated Activity 1',
				priorityRooms: []
			}

			const response = await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('priorityRooms').that.is.an('array').with.lengthOf(0)
			const activity = await ActivityModel.findById(testActivity1.id)
			expect(activity?.priorityRooms).to.have.lengthOf(0)
		})

		it('should populate the priorityRooms', async function () {
			const testRoom2 = await RoomModel.create({
				name: 'Room 2',
				description: 'Description for Room 2'
			})
			const updatedFields = {
				priorityRooms: [testRoom2.id.toString()]
			}

			const response = await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response.body.priorityRooms[0]).to.have.property('_id', testRoom2.id.toString())
			expect(response.body.priorityRooms[0]).to.have.property('name', 'Room 2')
			expect(response.body.priorityRooms[0]).to.have.property('description', 'Description for Room 2')
		})

		it('should allow updating name to current name', async function () {
			const updatedFields = {
				name: 'Activity 1'
			}
			const response = await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
			expect(response.body).to.have.property('name', updatedFields.name)
			expect(response.body.priorityRooms[0]._id).to.equal(testActivityFields1.priorityRooms[0])
		})

		it('should allow updating to current priorityRooms', async function () {
			const updatedFields = {
				name: 'Updated Activity 1',
				priorityRooms: testActivityFields1.priorityRooms
			}
			const response = await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
			expect(response.body.priorityRooms[0]._id).to.equal(testActivityFields1.priorityRooms[0])
		})

		it('should allow a partial update', async function () {
			const updatedFields = {
				name: 'Updated Activity 1'
			}

			await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields).set('Cookie', sessionCookie)
			const activity = await ActivityModel.findById(testActivity1.id)
			expect(activity).to.have.property('name', updatedFields.name)
		})

		it('should not update other fields', async function () {
			const updatedFields = {
				name: 'Updated Activity 1'
			}

			await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields).set('Cookie', sessionCookie)
			const activity = await ActivityModel.findById(testActivity1.id)
			const populatedActivity = await activity?.populate('priorityRooms') as IActivityPopulated
			expect(populatedActivity?.priorityRooms[0].id).to.equal(testActivityFields1.priorityRooms[0])
		})

		it('should not update other priorityActivities', async function () {
			const testRoom2 = await RoomModel.create({
				name: 'Room 2',
				description: 'Description for Room 2'
			})
			const testActivity2 = await ActivityModel.create({
				name: 'Activity 2',
				priorityRooms: [testRoom2.id]
			})

			const updatedFields = {
				name: 'Updated Activity 1',
				priorityRooms: [testRoom2.id.toString()]
			}

			await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields).set('Cookie', sessionCookie)
			const activity = await ActivityModel.findById(testActivity2.id)
			expect(activity).to.have.property('name', 'Activity 2')
			const populatedActivity = await activity?.populate('priorityRooms') as IActivityPopulated
			expect(populatedActivity?.priorityRooms[0].id).to.equal(testRoom2.id.toString())
		})

		it('should not allow updating the _id', async function () {
			const updatedFields = {
				_id: new mongoose.Types.ObjectId().toString()
			}

			await agent().patch(`/api/v1/activities/${testActivity1.id}`).send(updatedFields).set('Cookie', sessionCookie)
			const activity = await ActivityModel.findOne({})
			expect(activity?.id.toString()).to.equal(testActivity1.id)
		})

		it('should return 404 if the activity does not exist', async function () {
			const updatedFields = {
				name: 'Updated Activity 1',
				description: 'Updated Description for Activity 1'
			}

			const response = await agent().patch(`/api/v1/activities/${new mongoose.Types.ObjectId().toString()}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
		})

		it('should update to multiple priorityRooms', async function () {
			const testRoom2 = await RoomModel.create({
				name: 'Room 2',
				description: 'Description for Room 2'
			})
			const updatedFields = {
				name: 'Updated Activity 1',
				priorityRooms: [testActivityFields1.priorityRooms[0], testRoom2.id.toString()]
			}

			const response = await agent()
				.patch(`/api/v1/activities/${testActivity1.id}`)
				.send(updatedFields)
				.set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
			expect(response.body.priorityRooms).to.be.an('array').that.has.lengthOf(2)
			const roomIds = response.body.priorityRooms.map((room: { _id: string }) => room._id)
			expect(roomIds).to.have.members([testActivityFields1.priorityRooms[0], testRoom2.id.toString()])
		})

		it('should clear priorityRooms when setting to empty array', async function () {
			const updatedFields = {
				priorityRooms: []
			}

			const response = await agent()
				.patch(`/api/v1/activities/${testActivity1.id}`)
				.send(updatedFields)
				.set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
			expect(response.body.priorityRooms).to.be.an('array').that.has.lengthOf(0)
		})

		it('should throw error when updating to duplicate priorityRooms', async function () {
			const response = await agent()
				.patch(`/api/v1/activities/${testActivity1.id}`)
				.send({
					priorityRooms: [testActivityFields1.priorityRooms[0], testActivityFields1.priorityRooms[0]]
				})
				.set('Cookie', sessionCookie)
			expect(response).to.have.status(400)
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
				priorityRooms: [testRoom1.id]
			})
		})

		it('should have status 204', async function () {
			const response = await agent().delete(`/api/v1/activities/${testActivity1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response).to.have.status(204)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().delete(`/api/v1/activities/${testActivity1.id}`).send({ confirm: true })

			expect(response).to.have.status(403)
		})

		it('should delete an activity', async function () {
			const response = await agent().delete(`/api/v1/activities/${testActivity1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response.body).to.be.empty
			const product = await ActivityModel.findById(testActivity1.id)

			expect(product).to.not.exist
		})

		it('should not delete other priorityActivities', async function () {
			const testRoom2 = await RoomModel.create({
				name: 'Room 2',
				description: 'Description for Room 2'
			})
			const testActivity2 = await ActivityModel.create({
				name: 'Activity 2',
				priorityRooms: [testRoom2.id]
			})

			await agent().delete(`/api/v1/activities/${testActivity1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)
			const product = await ActivityModel.findById(testActivity2.id)

			expect(product).to.exist
		})

		it('should return 404 if the activity does not exist', async function () {
			const response = await agent().delete(`/api/v1/activities/${new mongoose.Types.ObjectId().toString()}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
		})

		it('should return an error if confirm false', async function () {
			const response = await agent().delete(`/api/v1/activities/${testActivity1.id}`).send({ confirm: false }).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should return an error if confirm not sent', async function () {
			const response = await agent().delete(`/api/v1/activities/${testActivity1.id}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should return an error if confirm not boolean', async function () {
			const response = await agent().delete(`/api/v1/activities/${testActivity1.id}`).send({ confirm: 'true' }).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})
	})
})
