/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose from 'mongoose'

import ActivityModel, { type IActivity } from '../../../app/models/Activity.js'
import AdminModel from '../../../app/models/Admin.js'
import KioskModel, { type IKiosk } from '../../../app/models/Kiosk.js'
import ReaderModel from '../../../app/models/Reader.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'
import { getChaiAgent as agent, extractConnectSid } from '../../testSetup.js'

describe('Kiosks routes', function () {
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

	describe('POST /v1/kiosks', function () {
		describe('No priorityActivities', function () {
			let testKioskFields: {
				name: string
				kioskTag: string
				readerId: mongoose.Types.ObjectId
			}

			beforeEach(async function () {
				const testReader = await ReaderModel.create({
					apiReferenceId: 'test',
					readerTag: '12345'
				})
				testKioskFields = {
					name: 'Test Kiosk',
					kioskTag: '12345',
					readerId: testReader.id
				}
			})

			it('should have status 201', async function () {
				const response = await agent().post('/api/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response).to.have.status(201)
			})

			it('should have status 403 if not logged in', async function () {
				const response = await agent().post('/api/v1/kiosks').send(testKioskFields)

				expect(response).to.have.status(403)
			})

			it('should create a new kiosk', async function () {
				await agent().post('/api/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				const kiosk = await KioskModel.findOne({})

				expect(kiosk).to.exist
				expect(kiosk).to.have.property('name', testKioskFields.name)
				expect(kiosk).to.have.property('kioskTag', testKioskFields.kioskTag)
				expect(kiosk).to.have.property('createdAt')
				expect(kiosk).to.have.property('updatedAt')
			})

			it('should return the newly created object', async function () {
				const response = await agent().post('/api/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response.body).to.have.property('name', testKioskFields.name)
				expect(response.body).to.have.property('kioskTag')
				expect(response.body).to.have.property('readerId').that.is.an('object')
				expect(response.body.readerId).to.have.property('_id', testKioskFields.readerId)
				expect(response.body.readerId).to.have.property('readerTag', '12345')
				expect(response.body).to.have.property('priorityActivities').that.is.an('array').that.is.empty
				expect(response.body).to.have.property('createdAt')
				expect(response.body).to.have.property('updatedAt')
				expect(response.body).to.have.property('_id')
			})

			it('should have an empty priorityActivities array', async function () {
				const response = await agent().post('/api/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response.body.priorityActivities).to.be.an('array').that.is.empty
			})
		})

		describe('No kioskTag', function () {
			let testRoom1: IRoom
			let testRoom2: IRoom
			let testKioskFields: {
				name: string
				priorityActivities: mongoose.Types.ObjectId[]
				readerId: mongoose.Types.ObjectId
			}

			beforeEach(async function () {
				testRoom1 = await RoomModel.create({
					name: 'Room 1',
					description: 'Description for Room 1'
				})
				testRoom2 = await RoomModel.create({
					name: 'Room 2',
					description: 'Description for Room 2'
				})

				const testActivity1 = await ActivityModel.create({
					name: 'Activity 1',
					priorityRooms: [testRoom1.id]
				})
				const testActivity2 = await ActivityModel.create({
					name: 'Activity 2',
					priorityRooms: [testRoom2.id]
				})

				const testReader = await ReaderModel.create({
					apiReferenceId: 'test',
					readerTag: '12345'
				})

				testKioskFields = {
					name: 'Test Kiosk',
					priorityActivities: [testActivity1.id.toString(), testActivity2.id.toString()],
					readerId: testReader.id
				}
			})

			it('should have status 201', async function () {
				const response = await agent().post('/api/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response).to.have.status(201)
			})

			it('should have status 403 if not logged in', async function () {
				const response = await agent().post('/api/v1/kiosks').send(testKioskFields)

				expect(response).to.have.status(403)
			})

			it('should create a new kiosk', async function () {
				await agent().post('/api/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				const kiosk = await KioskModel.findOne({})

				expect(kiosk).to.exist
				expect(kiosk).to.have.property('name', testKioskFields.name)
				expect(kiosk).to.have.property('kioskTag')
				const populatedKiosk = await kiosk?.populate('priorityActivities')
				expect(populatedKiosk?.priorityActivities[0]).to.have.property('id', testKioskFields.priorityActivities[0])
				expect(populatedKiosk?.priorityActivities[1]).to.have.property('id', testKioskFields.priorityActivities[1])
				expect(kiosk).to.have.property('createdAt')
				expect(kiosk).to.have.property('updatedAt')
			})

			it('should return the newly created object', async function () {
				const response = await agent().post('/api/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response.body.kioskTag).to.exist
				expect(response.body).to.have.property('name', testKioskFields.name)
				expect(response.body).to.have.property('priorityActivities')
				// Check activity IDs match
				expect(response.body.priorityActivities.map((activity: IActivity) => activity._id))
					.to.have.members(testKioskFields.priorityActivities)
				// Check activity names match
				expect(response.body.priorityActivities.map((activity: IActivity) => activity.name))
					.to.have.members(['Activity 1', 'Activity 2'])
				// Check each activity's priorityRooms array
				expect(response.body.priorityActivities[0].priorityRooms).to.have.members([testRoom1.id.toString()])
				expect(response.body.priorityActivities[1].priorityRooms).to.have.members([testRoom2.id.toString()])
				expect(response.body.readerId).to.have.property('_id', testKioskFields.readerId)
				expect(response.body).to.have.property('createdAt')
				expect(response.body).to.have.property('updatedAt')
				expect(response.body).to.have.property('_id')
			})
		})

		describe('All fields', function () {
			let testRoom1: IRoom
			let testRoom2: IRoom
			let testKioskFields: {
				name: string
				kioskTag: string
				priorityActivities: mongoose.Types.ObjectId[]
				readerId: mongoose.Types.ObjectId
			}

			beforeEach(async function () {
				testRoom1 = await RoomModel.create({
					name: 'Room 1',
					description: 'Description for Room 1'
				})
				testRoom2 = await RoomModel.create({
					name: 'Room 2',
					description: 'Description for Room 2'
				})

				const testActivity1 = await ActivityModel.create({
					name: 'Activity 1',
					priorityRooms: [testRoom1.id]
				})
				const testActivity2 = await ActivityModel.create({
					name: 'Activity 2',
					priorityRooms: [testRoom2.id]
				})

				const testReader = await ReaderModel.create({
					apiReferenceId: 'test',
					readerTag: '12345'
				})

				testKioskFields = {
					name: 'Test Kiosk',
					kioskTag: '12345',
					priorityActivities: [testActivity1.id.toString(), testActivity2.id.toString()],
					readerId: testReader.id
				}
			})

			it('should not allow setting the _id', async function () {
				const newId = new mongoose.Types.ObjectId().toString()
				const updatedFields = {
					_id: newId
				}

				await agent().post('/api/v1/kiosks').send(updatedFields).set('Cookie', sessionCookie)
				const kiosk = await KioskModel.findOne({})
				expect(kiosk?.id.toString()).to.not.equal(newId)
			})

			it('should have status 201', async function () {
				const response = await agent().post('/api/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response).to.have.status(201)
			})

			it('should have status 403 if not logged in', async function () {
				const response = await agent().post('/api/v1/kiosks').send(testKioskFields)

				expect(response).to.have.status(403)
			})

			it('should create a new kiosk', async function () {
				await agent().post('/api/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				const kiosk = await KioskModel.findOne({})

				expect(kiosk).to.exist
				expect(kiosk).to.have.property('kioskTag', testKioskFields.kioskTag)
				expect(kiosk).to.have.property('name', testKioskFields.name)
				const populatedKiosk = await kiosk?.populate('priorityActivities')
				expect(populatedKiosk?.priorityActivities[0]).to.have.property('id', testKioskFields.priorityActivities[0])
				expect(populatedKiosk?.priorityActivities[1]).to.have.property('id', testKioskFields.priorityActivities[1])
				expect(kiosk).to.have.property('createdAt')
				expect(kiosk).to.have.property('updatedAt')
			})

			it('should return the newly created object', async function () {
				const response = await agent().post('/api/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response.body).to.have.property('name', testKioskFields.name)
				expect(response.body).to.have.property('kioskTag', testKioskFields.kioskTag)
				expect(response.body).to.have.property('priorityActivities')
				// Check activity IDs match
				expect(response.body.priorityActivities.map((activity: IActivity) => activity._id))
					.to.have.members(testKioskFields.priorityActivities)
				// Check activity names match
				expect(response.body.priorityActivities.map((activity: IActivity) => activity.name))
					.to.have.members(['Activity 1', 'Activity 2'])
				// Check each activity's priorityRooms array
				expect(response.body.priorityActivities[0].priorityRooms).to.have.members([testRoom1.id.toString()])
				expect(response.body.priorityActivities[1].priorityRooms).to.have.members([testRoom2.id.toString()])
				expect(response.body.readerId).to.have.property('_id', testKioskFields.readerId)
				expect(response.body).to.have.property('createdAt')
				expect(response.body).to.have.property('updatedAt')
				expect(response.body).to.have.property('_id')
			})
		})
	})

	describe('GET /v1/kiosks/:id', function () {
		let testKiosk1: IKiosk
		let testKioskFields: {
			name: string
			kioskTag: string
			priorityActivities: mongoose.Types.ObjectId[]
			readerId: mongoose.Types.ObjectId
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

			const testActivity1 = await ActivityModel.create({
				name: 'Activity 1',
				priorityRooms: [testRoom1.id]
			})
			const testActivity2 = await ActivityModel.create({
				name: 'Activity 2',
				priorityRooms: [testRoom2.id]
			})

			const testReader = await ReaderModel.create({
				apiReferenceId: 'test',
				readerTag: '12345'
			})

			testKioskFields = {
				name: 'Test Kiosk',
				kioskTag: '12345',
				priorityActivities: [testActivity1.id.toString(), testActivity2.id.toString()],
				readerId: testReader.id
			}

			testKiosk1 = await KioskModel.create(testKioskFields)
		})

		it('should have status 200', async function () {
			const response = await agent().get(`/api/v1/kiosks/${testKiosk1.id}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().get(`/api/v1/kiosks/${testKiosk1.id}`)

			expect(response).to.have.status(403)
		})

		it('should return a kiosk', async function () {
			const response = await agent().get(`/api/v1/kiosks/${testKiosk1.id}`).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('name', testKioskFields.name)
			expect(response.body).to.have.property('kioskTag', testKioskFields.kioskTag)
			expect(response.body.priorityActivities.map((activity: IActivity) => activity._id)).to.have.members(testKioskFields.priorityActivities)
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
			expect(response.body).to.have.property('_id')
		})

		it('should populate the priorityActivities', async function () {
			const response = await agent().get(`/api/v1/kiosks/${testKiosk1.id}`).set('Cookie', sessionCookie)

			expect(response.body.priorityActivities[0]).to.have.property('name', 'Activity 1')
			expect(response.body.priorityActivities[1]).to.have.property('name', 'Activity 2')
		})

		it('should populate the reader', async function () {
			const response = await agent().get(`/api/v1/kiosks/${testKiosk1.id}`).set('Cookie', sessionCookie)

			expect(response.body.readerId).to.have.property('readerTag', '12345')
		})

		it('should return 404 if the kiosk does not exist', async function () {
			const response = await agent().get(`/api/v1/kiosks/${new mongoose.Types.ObjectId().toString()}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
		})
	})

	describe('GET /v1/kiosks', function () {
		let testKioskFields1: {
			name: string
			kioskTag: string
			priorityActivities: mongoose.Types.ObjectId[]
			readerId: mongoose.Types.ObjectId
		}
		let testKioskFields2: {
			name: string
			kioskTag: string
			priorityActivities: mongoose.Types.ObjectId[]
			readerId: mongoose.Types.ObjectId
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

			const testActivity1 = await ActivityModel.create({
				name: 'Activity 1',
				priorityRooms: [testRoom1.id]
			})
			const testActivity2 = await ActivityModel.create({
				name: 'Activity 2',
				priorityRooms: [testRoom2.id]
			})

			const testReader1 = await ReaderModel.create({
				apiReferenceId: 'test1',
				readerTag: '12345'
			})
			const testReader2 = await ReaderModel.create({
				apiReferenceId: 'test2',
				readerTag: '54321'
			})

			testKioskFields1 = {
				name: 'Test Kiosk 1',
				kioskTag: '12345',
				priorityActivities: [testActivity1.id.toString(), testActivity2.id.toString()],
				readerId: testReader1.id
			}
			testKioskFields2 = {
				name: 'Test Kiosk 2',
				kioskTag: '54321',
				priorityActivities: [testActivity1.id.toString()],
				readerId: testReader2.id
			}

			await KioskModel.create(testKioskFields1)
			await KioskModel.create(testKioskFields2)
		})

		it('should have status 200', async function () {
			const response = await agent().get('/api/v1/kiosks').set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().get('/api/v1/kiosks')

			expect(response).to.have.status(403)
		})

		it('should return all kiosks', async function () {
			const response = await agent().get('/api/v1/kiosks').set('Cookie', sessionCookie)

			expect(response.body).to.be.an('array')
			expect(response.body).to.have.lengthOf(2)
			expect(response.body[0]).to.have.property('kioskTag', testKioskFields1.kioskTag)
			expect(response.body[0]).to.have.property('name', testKioskFields1.name)
			expect(response.body[0].priorityActivities.map((activity: IActivity) => activity._id)).to.have.members(testKioskFields1.priorityActivities)
			expect(response.body[1]).to.have.property('kioskTag', testKioskFields2.kioskTag)
			expect(response.body[1]).to.have.property('name', testKioskFields2.name)
			expect(response.body[1].priorityActivities.map((activity: IActivity) => activity._id)).to.have.members(testKioskFields2.priorityActivities)
			expect(response.body.map((kiosk: IKiosk) => kiosk.createdAt)).to.have.lengthOf(2)
			expect(response.body.map((kiosk: IKiosk) => kiosk.updatedAt)).to.have.lengthOf(2)
			expect(response.body.map((kiosk: IKiosk) => kiosk._id)).to.have.lengthOf(2)
		})

		it('should populate the priorityActivities', async function () {
			const response = await agent().get('/api/v1/kiosks').set('Cookie', sessionCookie)

			expect(response.body[0].priorityActivities[0]).to.have.property('name', 'Activity 1')
			expect(response.body[0].priorityActivities[1]).to.have.property('name', 'Activity 2')
			expect(response.body[1].priorityActivities[0]).to.have.property('name', 'Activity 1')
		})

		it('should populate the reader', async function () {
			const response = await agent().get('/api/v1/kiosks').set('Cookie', sessionCookie)

			expect(response.body[0].readerId).to.have.property('readerTag', '12345')
			expect(response.body[1].readerId).to.have.property('readerTag', '54321')
		})
	})

	describe('PATCH /v1/kiosks/:id', function () {
		let testKiosk1: IKiosk
		let testKiosk2: IKiosk
		let testActivity1: IActivity
		let testActivity2: IActivity

		let testKioskFields1: {
			name: string
			kioskTag: string
			priorityActivities: mongoose.Types.ObjectId[]
			readerId: mongoose.Types.ObjectId
		}
		let testKioskFields2: {
			name: string
			kioskTag: string
			priorityActivities: mongoose.Types.ObjectId[]
			readerId: mongoose.Types.ObjectId
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
			testActivity2 = await ActivityModel.create({
				name: 'Activity 2',
				priorityRooms: [testRoom2.id]
			})

			const testReader1 = await ReaderModel.create({
				apiReferenceId: 'test1',
				readerTag: '12345'
			})
			const testReader2 = await ReaderModel.create({
				apiReferenceId: 'test2',
				readerTag: '54321'
			})

			testKioskFields1 = {
				name: 'Test Kiosk 1',
				kioskTag: '12345',
				priorityActivities: [testActivity1.id.toString(), testActivity2.id.toString()],
				readerId: testReader1.id
			}
			testKioskFields2 = {
				name: 'Test Kiosk 2',
				kioskTag: '54321',
				priorityActivities: [testActivity1.id.toString()],
				readerId: testReader2.id
			}

			testKiosk1 = await KioskModel.create(testKioskFields1)
			testKiosk2 = await KioskModel.create(testKioskFields2)
		})

		it('should have status 200', async function () {
			const updatedFields = {
				kioskTag: '45678',
				priorityActivities: [testKioskFields2.priorityActivities[0]]
			}

			const response = await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const updatedFields = {
				kioskTag: '45678',
				priorityActivities: [testKioskFields2.priorityActivities[0]]
			}

			const response = await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields)

			expect(response).to.have.status(403)
		})

		it('should update the kiosk', async function () {
			const updatedFields = {
				kioskTag: '45678',
				priorityActivities: [testActivity2.id.toString()]
			}

			await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk1.id)

			expect(kiosk).to.have.property('kioskTag', updatedFields.kioskTag)
			expect(kiosk?.priorityActivities[0].toString()).to.equal(updatedFields.priorityActivities[0])
		})

		it('should return the updated kiosk', async function () {
			const updatedFields = {
				kioskTag: '45678',
				priorityActivities: [testActivity2.id.toString()]
			}

			const response = await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('kioskTag', updatedFields.kioskTag)
			expect(response.body.priorityActivities[0]._id.toString()).to.equal(updatedFields.priorityActivities[0])
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
			expect(response.body).to.have.property('_id')
		})

		it('should unset the readerId when setting to null', async function () {
			const updatedFields = {
				readerId: null
			}

			const res = await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(res.body).to.have.property('readerId', null)
			const kiosk = await KioskModel.findById(testKiosk1.id)
			expect(kiosk).to.have.property('readerId', null)
		})

		it('should populate the priorityActivities', async function () {
			const updatedFields = {
				kioskTag: '45678',
				priorityActivities: [testActivity2.id.toString()]
			}

			const response = await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response.body.priorityActivities[0]).to.have.property('name', 'Activity 2')
		})

		it('should populate the reader', async function () {
			const updatedFields = {
				readerId: testKioskFields1.readerId
			}

			const response = await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response.body.readerId).to.have.property('readerTag', '12345')
		})

		it('should allow a partial update', async function () {
			const updatedFields = {
				kioskTag: '45678'
			}

			await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk1.id)

			expect(kiosk).to.have.property('kioskTag', updatedFields.kioskTag)
		})

		it('should not update other fields', async function () {
			const updatedFields = {
				kioskTag: '45678',
				priorityActivities: [testActivity2.id.toString()]
			}

			await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk1.id)

			const populatedKiosk = await kiosk?.populate('priorityActivities')
			expect(populatedKiosk?.priorityActivities[0]).to.have.property('id', updatedFields.priorityActivities[0])
			expect(kiosk).to.have.property('name', testKioskFields1.name)
			expect(kiosk).to.have.property('readerId').that.is.not.null
		})

		it('should not update other kiosks', async function () {
			const updatedFields = {
				kioskTag: '45678',
				priorityActivities: [testActivity2.id.toString()]
			}

			await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk2.id)

			expect(kiosk).to.have.property('kioskTag', testKioskFields2.kioskTag)
		})

		it('should allow updating tag to the current tag', async function () {
			const updatedFields = {
				kioskTag: testKioskFields1.kioskTag
			}

			const response = await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should not allow updating the _id', async function () {
			const updatedFields = {
				_id: new mongoose.Types.ObjectId().toString()
			}

			await agent().patch(`/api/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)
			const kiosk = await KioskModel.findOne({})
			expect(kiosk?.id.toString()).to.equal(testKiosk1.id)
		})

		it('should return 404 if the kiosk does not exist', async function () {
			const updatedFields = {
				kioskTag: '45678',
				priorityActivities: [testActivity2.id.toString()]
			}

			const response = await agent().patch(`/api/v1/kiosks/${new mongoose.Types.ObjectId().toString()}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
		})
	})

	describe('PATCH /v1/kiosks/:id/kioskTag', function () {
		let testKiosk1: IKiosk

		beforeEach(async function () {
			const testRoom1 = await RoomModel.create({
				name: 'Room 1',
				description: 'Description for Room 1'
			})
			const testActivity1 = await ActivityModel.create({
				name: 'Activity 1',
				priorityRooms: [testRoom1.id]
			})
			const testReader = await ReaderModel.create({
				apiReferenceId: 'test',
				readerTag: '12345'
			})
			testKiosk1 = await KioskModel.create({
				name: 'Kiosk 1',
				kioskTag: '12345',
				priorityActivities: [testActivity1.id],
				readerId: testReader.id
			})
		})

		it('should have status 200', async function () {
			const response = await agent().patch(`/api/v1/kiosks/${testKiosk1.id}/kioskTag`).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().patch(`/api/v1/kiosks/${testKiosk1.id}/kioskTag`)

			expect(response).to.have.status(403)
		})

		it('should update the kiosk', async function () {
			const oldKioskTag = testKiosk1.kioskTag

			await agent().patch(`/api/v1/kiosks/${testKiosk1.id}/kioskTag`).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk1.id)

			expect(kiosk).to.have.property('kioskTag').that.is.not.equal(oldKioskTag)
		})

		it('should return the updated kiosk', async function () {
			const response = await agent().patch(`/api/v1/kiosks/${testKiosk1.id}/kioskTag`).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('kioskTag').that.is.not.equal(testKiosk1.kioskTag)
		})

		it('should return 404 if the kiosk does not exist', async function () {
			const response = await agent().patch(`/api/v1/kiosks/${new mongoose.Types.ObjectId().toString()}/kioskTag`).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
		})
	})

	describe('DELETE /v1/kiosks/:id', function () {
		let testKiosk1: IKiosk
		let testActivity1: IActivity
		let testActivity2: IActivity

		let testKioskFields1: {
			name: string
			kioskTag: string
			priorityActivities: mongoose.Types.ObjectId[]
			readerId: mongoose.Types.ObjectId
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
			testActivity2 = await ActivityModel.create({
				name: 'Activity 2',
				priorityRooms: [testRoom2.id]
			})

			const testReader = await ReaderModel.create({
				apiReferenceId: 'test',
				readerTag: '12345'
			})

			testKioskFields1 = {
				name: 'Test Kiosk',
				kioskTag: '12345',
				priorityActivities: [testActivity1.id.toString(), testActivity2.id.toString()],
				readerId: testReader.id
			}

			testKiosk1 = await KioskModel.create(testKioskFields1)
		})

		it('should have status 204', async function () {
			const response = await agent().delete(`/api/v1/kiosks/${testKiosk1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response).to.have.status(204)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().delete(`/api/v1/kiosks/${testKiosk1.id}`).send({ confirm: true })

			expect(response).to.have.status(403)
		})

		it('should delete a kiosk', async function () {
			const response = await agent().delete(`/api/v1/kiosks/${testKiosk1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response.body).to.be.empty
			const product = await KioskModel.findById(testKiosk1.id)

			expect(product).to.not.exist
		})

		it('should not delete other kiosks', async function () {
			const testReader = await ReaderModel.create({
				apiReferenceId: 'test2',
				readerTag: '54321'
			})
			const testKioskFields2 = {
				name: 'Test Kiosk 2',
				kioskTag: '54321',
				priorityActivities: [testActivity1.id.toString()],
				readerId: testReader.id
			}
			const testKiosk2 = await KioskModel.create(testKioskFields2)

			await agent().delete(`/api/v1/kiosks/${testKiosk1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk2.id)

			expect(kiosk).to.exist
		})

		it('should return 404 if the kiosk does not exist', async function () {
			const response = await agent().delete(`/api/v1/kiosks/${new mongoose.Types.ObjectId().toString()}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
		})

		it('should return an error if confirm false', async function () {
			const response = await agent().delete(`/api/v1/kiosks/${testKiosk1.id}`).send({ confirm: false }).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should return an error if confirm not sent', async function () {
			const response = await agent().delete(`/api/v1/kiosks/${testKiosk1.id}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should return an error if confirm not boolean', async function () {
			const response = await agent().delete(`/api/v1/kiosks/${testKiosk1.id}`).send({ confirm: 'true' }).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})
	})
})
