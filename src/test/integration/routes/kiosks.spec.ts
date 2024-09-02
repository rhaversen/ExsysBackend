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
import KioskModel, { type IKiosk } from '../../../app/models/Kiosk.js'
import { chaiAppServer as agent } from '../../testSetup.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'
import ActivityModel, { type IActivity } from '../../../app/models/Activity.js'
import AdminModel from '../../../app/models/Admin.js'
import ReaderModel from '../../../app/models/Reader.js'

describe('Kiosks routes', function () {
	let sessionCookie: string

	beforeEach(async function () {
		// Log the agent in to get a valid session
		const adminFields = {
			name: 'Agent Admin',
			password: 'agentPassword'
		}
		await AdminModel.create(adminFields)

		const response = await agent.post('/v1/auth/login-admin-local').send(adminFields)
		sessionCookie = response.headers['set-cookie']
	})

	describe('POST /v1/kiosks', function () {
		describe('No activities', function () {
			let testKioskFields: {
				name: string
				kioskTag: string
				password: string
				readerId: mongoose.Types.ObjectId
			}

			beforeEach(async function () {
				const testReader = await ReaderModel.create({ apiReferenceId: 'test', readerTag: '12345' })
				testKioskFields = {
					name: 'Test Kiosk',
					kioskTag: '12345',
					password: 'Test Password',
					readerId: testReader.id
				}
			})

			it('should have status 201', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response).to.have.status(201)
			})

			it('should have status 403 if not logged in', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields)

				expect(response).to.have.status(403)
			})

			it('should create a new kiosk', async function () {
				await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				const kiosk = await KioskModel.findOne({})

				expect(kiosk).to.exist
				expect(kiosk).to.have.property('name', testKioskFields.name)
				expect(kiosk).to.have.property('kioskTag', testKioskFields.kioskTag)
				expect(kiosk).to.have.property('password')
				const passwordMatch = await kiosk?.comparePassword(testKioskFields.password)
				expect(passwordMatch).to.be.true
				expect(kiosk).to.have.property('createdAt')
				expect(kiosk).to.have.property('updatedAt')
			})

			it('should return the newly created object', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response.body).to.have.property('name', testKioskFields.name)
				expect(response.body).to.have.property('kioskTag', testKioskFields.kioskTag)
				expect(response.body).to.have.property('createdAt')
				expect(response.body).to.have.property('updatedAt')
				expect(response.body).to.have.property('_id')
			})

			it('should not return the password', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response.body).to.not.have.property('password')
			})

			it('should have an empty activities array', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response.body.activities).to.be.an('array').that.is.empty
			})
		})

		describe('No kioskTag', function () {
			let testRoom1: IRoom
			let testRoom2: IRoom
			let testKioskFields: {
				name: string
				password: string
				activities: mongoose.Types.ObjectId[]
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
					roomId: testRoom1.id
				})
				const testActivity2 = await ActivityModel.create({
					name: 'Activity 2',
					roomId: testRoom2.id
				})

				const testReader = await ReaderModel.create({ apiReferenceId: 'test', readerTag: '12345' })

				testKioskFields = {
					name: 'Test Kiosk',
					password: 'Test Password',
					activities: [testActivity1.id.toString(), testActivity2.id.toString()],
					readerId: testReader.id
				}
			})

			it('should have status 201', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response).to.have.status(201)
			})

			it('should have status 403 if not logged in', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields)

				expect(response).to.have.status(403)
			})

			it('should create a new kiosk', async function () {
				await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				const kiosk = await KioskModel.findOne({})

				expect(kiosk).to.exist
				expect(kiosk).to.have.property('name', testKioskFields.name)
				expect(kiosk).to.have.property('kioskTag')
				const populatedKiosk = await kiosk?.populate('activities')
				expect(populatedKiosk?.activities[0]).to.have.property('id', testKioskFields.activities[0])
				expect(populatedKiosk?.activities[1]).to.have.property('id', testKioskFields.activities[1])
				expect(kiosk).to.have.property('createdAt')
				expect(kiosk).to.have.property('updatedAt')
			})

			it('should return the newly created object', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response.body.kioskTag).to.exist
				expect(response.body).to.have.property('name', testKioskFields.name)
				expect(response.body).to.have.property('activities')
				expect(response.body.activities.map((activity: IActivity) => activity._id)).to.have.members(testKioskFields.activities)
				expect(response.body.activities.map((activity: IActivity) => activity.name)).to.have.members(['Activity 1', 'Activity 2'])
				expect(response.body.activities.map((activity: IActivity) => activity.roomId)).to.have.members([testRoom1.id.toString(), testRoom2.id.toString()])
				expect(response.body).to.have.property('createdAt')
				expect(response.body).to.have.property('updatedAt')
				expect(response.body).to.have.property('_id')
			})

			it('should not return the password', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response.body).to.not.have.property('password')
			})
		})

		describe('All fields', function () {
			let testRoom1: IRoom
			let testRoom2: IRoom
			let testKioskFields: {
				name: string
				kioskTag: string
				password: string
				activities: mongoose.Types.ObjectId[]
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
					roomId: testRoom1.id
				})
				const testActivity2 = await ActivityModel.create({
					name: 'Activity 2',
					roomId: testRoom2.id
				})

				const testReader = await ReaderModel.create({ apiReferenceId: 'test', readerTag: '12345' })

				testKioskFields = {
					name: 'Test Kiosk',
					kioskTag: '12345',
					password: 'Test Password',
					activities: [testActivity1.id.toString(), testActivity2.id.toString()],
					readerId: testReader.id
				}
			})

			it('should not allow setting the _id', async function () {
				const newId = new mongoose.Types.ObjectId().toString()
				const updatedFields = {
					_id: newId
				}

				await agent.post('/v1/kiosks').send(updatedFields).set('Cookie', sessionCookie)
				const kiosk = await KioskModel.findOne({})
				expect(kiosk?.id.toString()).to.not.equal(newId)
			})

			it('should have status 201', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response).to.have.status(201)
			})

			it('should have status 403 if not logged in', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields)

				expect(response).to.have.status(403)
			})

			it('should create a new kiosk', async function () {
				await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				const kiosk = await KioskModel.findOne({})

				expect(kiosk).to.exist
				expect(kiosk).to.have.property('kioskTag', testKioskFields.kioskTag)
				expect(kiosk).to.have.property('password')
				const passwordMatch = await kiosk?.comparePassword(testKioskFields.password)
				expect(passwordMatch).to.be.true
				expect(kiosk).to.have.property('name', testKioskFields.name)
				const populatedKiosk = await kiosk?.populate('activities')
				expect(populatedKiosk?.activities[0]).to.have.property('id', testKioskFields.activities[0])
				expect(populatedKiosk?.activities[1]).to.have.property('id', testKioskFields.activities[1])
				expect(kiosk).to.have.property('createdAt')
				expect(kiosk).to.have.property('updatedAt')
			})

			it('should return the newly created object', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response.body).to.have.property('name', testKioskFields.name)
				expect(response.body).to.have.property('kioskTag', testKioskFields.kioskTag)
				expect(response.body.activities.map((activity: IActivity) => activity._id)).to.have.members(testKioskFields.activities)
				expect(response.body.activities.map((activity: IActivity) => activity.name)).to.have.members(['Activity 1', 'Activity 2'])
				expect(response.body.activities.map((activity: IActivity) => activity.roomId)).to.have.members([testRoom1.id.toString(), testRoom2.id.toString()])
				expect(response.body).to.have.property('createdAt')
				expect(response.body).to.have.property('updatedAt')
				expect(response.body).to.have.property('_id')
			})

			it('should not return the password', async function () {
				const response = await agent.post('/v1/kiosks').send(testKioskFields).set('Cookie', sessionCookie)

				expect(response.body).to.not.have.property('password')
			})
		})
	})

	describe('GET /v1/kiosks/:id', function () {
		let testKiosk1: IKiosk
		let testKioskFields: {
			name: string
			kioskTag: string
			password: string
			activities: mongoose.Types.ObjectId[]
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
				roomId: testRoom1.id
			})
			const testActivity2 = await ActivityModel.create({
				name: 'Activity 2',
				roomId: testRoom2.id
			})

			const testReader = await ReaderModel.create({ apiReferenceId: 'test', readerTag: '12345' })

			testKioskFields = {
				name: 'Test Kiosk',
				kioskTag: '12345',
				password: 'Test Password',
				activities: [testActivity1.id.toString(), testActivity2.id.toString()],
				readerId: testReader.id
			}

			testKiosk1 = await KioskModel.create(testKioskFields)
		})

		it('should have status 200', async function () {
			const response = await agent.get(`/v1/kiosks/${testKiosk1.id}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.get(`/v1/kiosks/${testKiosk1.id}`)

			expect(response).to.have.status(403)
		})

		it('should return a kiosk', async function () {
			const response = await agent.get(`/v1/kiosks/${testKiosk1.id}`).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('name', testKioskFields.name)
			expect(response.body).to.have.property('kioskTag', testKioskFields.kioskTag)
			expect(response.body.activities.map((activity: IActivity) => activity._id)).to.have.members(testKioskFields.activities)
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
			expect(response.body).to.have.property('_id')
		})

		it('should not return the password', async function () {
			const response = await agent.get(`/v1/kiosks/${testKiosk1.id}`).set('Cookie', sessionCookie)

			expect(response.body).to.not.have.property('password')
		})

		it('should populate the activities', async function () {
			const response = await agent.get(`/v1/kiosks/${testKiosk1.id}`).set('Cookie', sessionCookie)

			expect(response.body.activities[0]).to.have.property('name', 'Activity 1')
			expect(response.body.activities[1]).to.have.property('name', 'Activity 2')
		})

		it('should return 404 if the kiosk does not exist', async function () {
			const response = await agent.get(`/v1/kiosks/${new mongoose.Types.ObjectId().toString()}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
		})
	})

	describe('GET /v1/kiosks', function () {
		let testKioskFields1: {
			name: string
			kioskTag: string
			password: string
			activities: mongoose.Types.ObjectId[]
			readerId: mongoose.Types.ObjectId
		}
		let testKioskFields2: {
			name: string
			kioskTag: string
			password: string
			activities: mongoose.Types.ObjectId[]
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
				roomId: testRoom1.id
			})
			const testActivity2 = await ActivityModel.create({
				name: 'Activity 2',
				roomId: testRoom2.id
			})

			const testReader1 = await ReaderModel.create({ apiReferenceId: 'test1', readerTag: '12345' })
			const testReader2 = await ReaderModel.create({ apiReferenceId: 'test2', readerTag: '54321' })

			testKioskFields1 = {
				name: 'Test Kiosk 1',
				kioskTag: '12345',
				password: 'Test Password',
				activities: [testActivity1.id.toString(), testActivity2.id.toString()],
				readerId: testReader1.id
			}
			testKioskFields2 = {
				name: 'Test Kiosk 2',
				kioskTag: '54321',
				password: 'Test Password',
				activities: [testActivity1.id.toString()],
				readerId: testReader2.id
			}

			await KioskModel.create(testKioskFields1)
			await KioskModel.create(testKioskFields2)
		})

		it('should have status 200', async function () {
			const response = await agent.get('/v1/kiosks').set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.get('/v1/kiosks')

			expect(response).to.have.status(403)
		})

		it('should return all kiosks', async function () {
			const response = await agent.get('/v1/kiosks').set('Cookie', sessionCookie)

			expect(response.body).to.be.an('array')
			expect(response.body).to.have.lengthOf(2)
			expect(response.body[0]).to.have.property('kioskTag', testKioskFields1.kioskTag)
			expect(response.body[0]).to.have.property('name', testKioskFields1.name)
			expect(response.body[0].activities.map((activity: IActivity) => activity._id)).to.have.members(testKioskFields1.activities)
			expect(response.body[1]).to.have.property('kioskTag', testKioskFields2.kioskTag)
			expect(response.body[1]).to.have.property('name', testKioskFields2.name)
			expect(response.body[1].activities.map((activity: IActivity) => activity._id)).to.have.members(testKioskFields2.activities)
			expect(response.body.map((kiosk: IKiosk) => kiosk.createdAt)).to.have.lengthOf(2)
			expect(response.body.map((kiosk: IKiosk) => kiosk.updatedAt)).to.have.lengthOf(2)
			expect(response.body.map((kiosk: IKiosk) => kiosk._id)).to.have.lengthOf(2)
		})

		it('should not return the password', async function () {
			const response = await agent.get('/v1/kiosks').set('Cookie', sessionCookie)

			expect(response.body[0]).to.not.have.property('password')
			expect(response.body[1]).to.not.have.property('password')
		})

		it('should populate the activities', async function () {
			const response = await agent.get('/v1/kiosks').set('Cookie', sessionCookie)

			expect(response.body[0].activities[0]).to.have.property('name', 'Activity 1')
			expect(response.body[0].activities[1]).to.have.property('name', 'Activity 2')
			expect(response.body[1].activities[0]).to.have.property('name', 'Activity 1')
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
			password: string
			activities: mongoose.Types.ObjectId[]
			readerId: mongoose.Types.ObjectId
		}
		let testKioskFields2: {
			name: string
			kioskTag: string
			password: string
			activities: mongoose.Types.ObjectId[]
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
				roomId: testRoom1.id
			})
			testActivity2 = await ActivityModel.create({
				name: 'Activity 2',
				roomId: testRoom2.id
			})

			const testReader1 = await ReaderModel.create({ apiReferenceId: 'test1', readerTag: '12345' })
			const testReader2 = await ReaderModel.create({ apiReferenceId: 'test2', readerTag: '54321' })

			testKioskFields1 = {
				name: 'Test Kiosk 1',
				kioskTag: '12345',
				password: 'Test Password',
				activities: [testActivity1.id.toString(), testActivity2.id.toString()],
				readerId: testReader1.id
			}
			testKioskFields2 = {
				name: 'Test Kiosk 2',
				kioskTag: '54321',
				password: 'Test Password',
				activities: [testActivity1.id.toString()],
				readerId: testReader2.id
			}

			testKiosk1 = await KioskModel.create(testKioskFields1)
			testKiosk2 = await KioskModel.create(testKioskFields2)
		})

		it('should have status 200', async function () {
			const updatedFields = {
				kioskTag: '45678',
				activities: [testKioskFields2.activities[0]]
			}

			const response = await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const updatedFields = {
				kioskTag: '45678',
				activities: [testKioskFields2.activities[0]]
			}

			const response = await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields)

			expect(response).to.have.status(403)
		})

		it('should update the kiosk', async function () {
			const updatedFields = {
				kioskTag: '45678',
				activities: [testActivity2.id.toString()]
			}

			await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk1.id)

			expect(kiosk).to.have.property('kioskTag', updatedFields.kioskTag)
			expect(kiosk?.activities[0].toString()).to.equal(updatedFields.activities[0])
		})

		it('should return the updated kiosk', async function () {
			const updatedFields = {
				kioskTag: '45678',
				activities: [testActivity2.id.toString()]
			}

			const response = await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('kioskTag', updatedFields.kioskTag)
			expect(response.body.activities[0]._id.toString()).to.equal(updatedFields.activities[0])
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
			expect(response.body).to.have.property('_id')
		})

		it('should not return the password', async function () {
			const updatedFields = {
				kioskTag: '45678',
				activities: [testActivity2.id.toString()]
			}

			const response = await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response.body).to.not.have.property('password')
		})

		it('should populate the activities', async function () {
			const updatedFields = {
				kioskTag: '45678',
				activities: [testActivity2.id.toString()]
			}

			const response = await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response.body.activities[0]).to.have.property('name', 'Activity 2')
		})

		it('should allow a partial update', async function () {
			const updatedFields = {
				kioskTag: '45678'
			}

			await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk1.id)

			expect(kiosk).to.have.property('kioskTag', updatedFields.kioskTag)
		})

		it('should update the password', async function () {
			const updatedFields = {
				password: 'New Password'
			}

			await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk1.id)
			expect(kiosk).to.have.property('password')
			const passwordMatch = await kiosk?.comparePassword(updatedFields.password)
			expect(passwordMatch).to.be.true
		})

		it('should not update other fields', async function () {
			const updatedFields = {
				kioskTag: '45678',
				activities: [testActivity2.id.toString()]
			}

			await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk1.id)

			expect(kiosk).to.have.property('kioskTag', updatedFields.kioskTag)
			const populatedKiosk = await kiosk?.populate('activities')
			expect(populatedKiosk?.activities[0]).to.have.property('id', updatedFields.activities[0])
		})

		it('should not update other kiosks', async function () {
			const updatedFields = {
				kioskTag: '45678',
				activities: [testActivity2.id.toString()]
			}

			await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk2.id)

			expect(kiosk).to.have.property('kioskTag', testKioskFields2.kioskTag)
		})

		it('should allow updating tag to the current tag', async function () {
			const updatedFields = {
				kioskTag: testKioskFields1.kioskTag
			}

			const response = await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should not allow updating the _id', async function () {
			const updatedFields = {
				_id: new mongoose.Types.ObjectId().toString()
			}

			await agent.patch(`/v1/kiosks/${testKiosk1.id}`).send(updatedFields).set('Cookie', sessionCookie)
			const kiosk = await KioskModel.findOne({})
			expect(kiosk?.id.toString()).to.equal(testKiosk1.id)
		})

		it('should return 404 if the kiosk does not exist', async function () {
			const updatedFields = {
				kioskTag: '45678',
				activities: [testActivity2.id.toString()]
			}

			const response = await agent.patch(`/v1/kiosks/${new mongoose.Types.ObjectId().toString()}`).send(updatedFields).set('Cookie', sessionCookie)

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
				roomId: testRoom1.id
			})
			const testReader = await ReaderModel.create({ apiReferenceId: 'test', readerTag: '12345' })
			testKiosk1 = await KioskModel.create({
				name: 'Kiosk 1',
				kioskTag: '12345',
				password: 'Test Password',
				activities: [testActivity1.id],
				readerId: testReader.id
			})
		})

		it('should have status 200', async function () {
			const response = await agent.patch(`/v1/kiosks/${testKiosk1.id}/kioskTag`).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.patch(`/v1/kiosks/${testKiosk1.id}/kioskTag`)

			expect(response).to.have.status(403)
		})

		it('should update the kiosk', async function () {
			const oldKioskTag = testKiosk1.kioskTag

			await agent.patch(`/v1/kiosks/${testKiosk1.id}/kioskTag`).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk1.id)

			expect(kiosk).to.have.property('kioskTag').that.is.not.equal(oldKioskTag)
		})

		it('should return the updated kiosk', async function () {
			const response = await agent.patch(`/v1/kiosks/${testKiosk1.id}/kioskTag`).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('kioskTag').that.is.not.equal(testKiosk1.kioskTag)
		})

		it('should return 404 if the kiosk does not exist', async function () {
			const response = await agent.patch(`/v1/kiosks/${new mongoose.Types.ObjectId().toString()}/kioskTag`).set('Cookie', sessionCookie)

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
			password: string
			activities: mongoose.Types.ObjectId[]
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
				roomId: testRoom1.id
			})
			testActivity2 = await ActivityModel.create({
				name: 'Activity 2',
				roomId: testRoom2.id
			})

			const testReader = await ReaderModel.create({ apiReferenceId: 'test', readerTag: '12345' })

			testKioskFields1 = {
				name: 'Test Kiosk',
				kioskTag: '12345',
				password: 'Test Password',
				activities: [testActivity1.id.toString(), testActivity2.id.toString()],
				readerId: testReader.id
			}

			testKiosk1 = await KioskModel.create(testKioskFields1)
		})

		it('should have status 204', async function () {
			const response = await agent.delete(`/v1/kiosks/${testKiosk1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response).to.have.status(204)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.delete(`/v1/kiosks/${testKiosk1.id}`).send({ confirm: true })

			expect(response).to.have.status(403)
		})

		it('should delete a kiosk', async function () {
			const response = await agent.delete(`/v1/kiosks/${testKiosk1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response.body).to.be.empty
			const product = await KioskModel.findById(testKiosk1.id)

			expect(product).to.not.exist
		})

		it('should not delete other kiosks', async function () {
			const testReader = await ReaderModel.create({ apiReferenceId: 'test2', readerTag: '54321' })
			const testKioskFields2 = {
				name: 'Test Kiosk 2',
				kioskTag: '54321',
				password: 'Test Password',
				activities: [testActivity1.id.toString()],
				readerId: testReader.id
			}
			const testKiosk2 = await KioskModel.create(testKioskFields2)

			await agent.delete(`/v1/kiosks/${testKiosk1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			const kiosk = await KioskModel.findById(testKiosk2.id)

			expect(kiosk).to.exist
		})

		it('should return 404 if the kiosk does not exist', async function () {
			const response = await agent.delete(`/v1/kiosks/${new mongoose.Types.ObjectId().toString()}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
		})

		it('should return an error if confirm false', async function () {
			const response = await agent.delete(`/v1/kiosks/${testKiosk1.id}`).send({ confirm: false }).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should return an error if confirm not sent', async function () {
			const response = await agent.delete(`/v1/kiosks/${testKiosk1.id}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should return an error if confirm not boolean', async function () {
			const response = await agent.delete(`/v1/kiosks/${testKiosk1.id}`).send({ confirm: 'true' }).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})
	})
})
