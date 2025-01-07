/* eslint-disable local/enforce-comment-order */
 
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose from 'mongoose'

// Own modules
import RoomModel, { type IRoom } from '../../../app/models/Room.js'
import { chaiAppServer as agent } from '../../testSetup.js'
import AdminModel from '../../../app/models/Admin.js'

describe('Rooms routes', function () {
	let sessionCookie: string

	beforeEach(async function () {
		// Log the agent in to get a valid session
		const adminFields = {
			name: 'Agent Admin',
			password: 'agentPassword'
		}
		await AdminModel.create(adminFields)

		const response = await agent.post('/api/v1/auth/login-admin-local').send(adminFields)
		sessionCookie = response.headers['set-cookie']
	})

	describe('POST /v1/rooms', function () {
		const testRoomFields1 = {
			name: 'Room 1',
			description: 'Description for Room 1'
		}

		it('should have status 201', async function () {
			const response = await agent.post('/api/v1/rooms').send(testRoomFields1).set('Cookie', sessionCookie)

			expect(response).to.have.status(201)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.post('/api/v1/rooms').send(testRoomFields1)

			expect(response).to.have.status(403)
		})

		it('should create a new room', async function () {
			await agent.post('/api/v1/rooms').send(testRoomFields1).set('Cookie', sessionCookie)

			const room = await RoomModel.findOne({})
			expect(room).to.exist
			expect(room).to.have.property('name', testRoomFields1.name)
			expect(room).to.have.property('description', testRoomFields1.description)
			expect(room).to.have.property('createdAt')
			expect(room).to.have.property('updatedAt')
		})

		it('should return the newly created object', async function () {
			const response = await agent.post('/api/v1/rooms').send(testRoomFields1).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('name', testRoomFields1.name)
			expect(response.body).to.have.property('description', testRoomFields1.description)
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
			expect(response.body).to.have.property('_id')
		})

		it('should not allow setting the _id', async function () {
			const newId = new mongoose.Types.ObjectId().toString()
			const updatedFields = {
				_id: newId
			}

			await agent.post('/api/v1/rooms').send(updatedFields).set('Cookie', sessionCookie)
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

		it('should have status 200', async function () {
			const response = await agent.get(`/api/v1/rooms/${testRoom1.id}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.get(`/api/v1/rooms/${testRoom1.id}`)

			expect(response).to.have.status(403)
		})

		it('should return a room', async function () {
			const response = await agent.get(`/api/v1/rooms/${testRoom1.id}`).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('name', testRoomFields1.name)
			expect(response.body).to.have.property('description', testRoomFields1.description)
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
		})

		it('should return 404 if the room does not exist', async function () {
			const response = await agent.get(`/api/v1/rooms/${new mongoose.Types.ObjectId().toString()}`).set('Cookie', sessionCookie)

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

		it('should have status 200', async function () {
			const response = await agent.get('/api/v1/rooms').set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.get('/api/v1/rooms')

			expect(response).to.have.status(403)
		})

		it('should return all rooms', async function () {
			const response = await agent.get('/api/v1/rooms').set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
			expect(response.body).to.be.an('array')
			expect(response.body).to.have.lengthOf(2)
			expect(response.body.map((room: IRoom) => room.name)).to.include.members([testRoomFields1.name, testRoomFields2.name])
			expect(response.body.map((room: IRoom) => room.createdAt)).to.have.lengthOf(2)
			expect(response.body.map((room: IRoom) => room.updatedAt)).to.have.lengthOf(2)
			expect(response.body.map((room: IRoom) => room._id)).to.have.lengthOf(2)
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

		it('should have status 200', async function () {
			const updatedFields = {
				name: 'Updated Room 1',
				description: 'Updated Description for Room 1'
			}

			const response = await agent.patch(`/api/v1/rooms/${testRoom1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const updatedFields = {
				name: 'Updated Room 1',
				description: 'Updated Description for Room 1'
			}

			const response = await agent.patch(`/api/v1/rooms/${testRoom1.id}`).send(updatedFields)

			expect(response).to.have.status(403)
		})

		it('should update a room', async function () {
			const updatedFields = {
				name: 'Updated Room 1',
				description: 'Updated Description for Room 1'
			}

			const response = await agent.patch(`/api/v1/rooms/${testRoom1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
			expect(response.body).to.have.property('name', updatedFields.name)
			expect(response.body).to.have.property('description', updatedFields.description)
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
			expect(response.body).to.have.property('_id')
		})

		it('should allow updating name to current name', async function () {
			const updatedFields = {
				name: testRoomFields1.name
			}

			const response = await agent.patch(`/api/v1/rooms/${testRoom1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
			expect(response.body).to.have.property('name', updatedFields.name)
			expect(response.body).to.have.property('description', testRoomFields1.description)
		})

		it('should not allow updating the _id', async function () {
			const updatedFields = {
				_id: new mongoose.Types.ObjectId().toString()
			}

			await agent.patch(`/api/v1/rooms/${testRoom1.id}`).send(updatedFields).set('Cookie', sessionCookie)
			const room = await RoomModel.findOne({})
			expect(room?.id.toString()).to.equal(testRoom1.id)
		})

		it('should return 404 if the room does not exist', async function () {
			const updatedFields = {
				name: 'Updated Room 1',
				description: 'Updated Description for Room 1'
			}

			const response = await agent.patch(`/api/v1/rooms/${new mongoose.Types.ObjectId().toString()}`).send(updatedFields).set('Cookie', sessionCookie)

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

		it('should have status 204', async function () {
			const response = await agent.delete(`/api/v1/rooms/${testRoom1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response).to.have.status(204)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.delete(`/api/v1/rooms/${testRoom1.id}`).send({ confirm: true })

			expect(response).to.have.status(403)
		})

		it('should delete a room', async function () {
			const response = await agent.delete(`/api/v1/rooms/${testRoom1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response.body).to.be.empty
			const product = await RoomModel.findById(testRoom1.id)
			expect(product).to.not.exist
		})

		it('should return 404 if the room does not exist', async function () {
			const response = await agent.delete(`/api/v1/rooms/${new mongoose.Types.ObjectId().toString()}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
		})

		it('should return an error if confirm false', async function () {
			const response = await agent.delete(`/api/v1/rooms/${testRoom1.id}`).send({ confirm: false }).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should return an error if confirm not sent', async function () {
			const response = await agent.delete(`/api/v1/rooms/${testRoom1.id}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should return an error if confirm not boolean', async function () {
			const response = await agent.delete(`/api/v1/rooms/${testRoom1.id}`).send({ confirm: 'true' }).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})
	})
})
