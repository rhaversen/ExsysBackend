/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose from 'mongoose'

import AdminModel from '../../../app/models/Admin.js'
import OptionModel, { type IOption } from '../../../app/models/Option.js'
import { getChaiAgent as agent, extractConnectSid } from '../../testSetup.js'

describe('Options routes', function () {
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

	describe('POST /v1/options', function () {
		const testOptionFields1 = {
			name: 'Option 1',
			imageURL: 'https://example.com/image.jpg',
			price: 10
		}

		it('should have status 201', async function () {
			const response = await agent().post('/api/v1/options').send(testOptionFields1).set('Cookie', sessionCookie)

			expect(response).to.have.status(201)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().post('/api/v1/options').send(testOptionFields1)

			expect(response).to.have.status(403)
		})

		it('should create a new option', async function () {
			await agent().post('/api/v1/options').send(testOptionFields1).set('Cookie', sessionCookie)

			const option = await OptionModel.findOne({})
			expect(option).to.exist
			expect(option).to.have.property('name', testOptionFields1.name)
			expect(option).to.have.property('imageURL', testOptionFields1.imageURL)
			expect(option).to.have.property('price', testOptionFields1.price)
			expect(option).to.have.property('createdAt')
			expect(option).to.have.property('updatedAt')
		})

		it('should return the newly created object', async function () {
			const response = await agent().post('/api/v1/options').send(testOptionFields1).set('Cookie', sessionCookie)

			expect(response).to.have.status(201)
			expect(response.body).to.have.property('name', testOptionFields1.name)
			expect(response.body).to.have.property('imageURL', testOptionFields1.imageURL)
			expect(response.body).to.have.property('price', testOptionFields1.price)
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
			expect(response.body).to.have.property('_id')
		})

		it('should not allow setting the _id', async function () {
			const newId = new mongoose.Types.ObjectId().toString()
			const updatedFields = {
				_id: newId
			}

			await agent().post('/api/v1/options').send(updatedFields).set('Cookie', sessionCookie)
			const option = await OptionModel.findOne({})
			expect(option?.id.toString()).to.not.equal(newId)
		})
	})

	describe('GET /v1/options', function () {
		const testOptionFields1 = {
			name: 'Option 1',
			imageURL: 'https://example.com/image1.jpg',
			price: 10
		}

		const testOptionFields2 = {
			name: 'Option 2',
			imageURL: 'https://example.com/image2.jpg',
			price: 20
		}

		beforeEach(async function () {
			await OptionModel.create(testOptionFields1)
			await OptionModel.create(testOptionFields2)
		})

		it('should have status 200', async function () {
			const response = await agent().get('/api/v1/options').set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().get('/api/v1/options')

			expect(response).to.have.status(403)
		})

		it('should return all options', async function () {
			const response = await agent().get('/api/v1/options').set('Cookie', sessionCookie)

			expect(response.body).to.be.an('array')
			expect(response.body).to.have.length(2)
			expect(response.body[0]).to.have.property('name', testOptionFields1.name)
			expect(response.body[0]).to.have.property('imageURL', testOptionFields1.imageURL)
			expect(response.body[0]).to.have.property('price', testOptionFields1.price)
			expect(response.body[1]).to.have.property('name', testOptionFields2.name)
			expect(response.body[1]).to.have.property('imageURL', testOptionFields2.imageURL)
			expect(response.body[1]).to.have.property('price', testOptionFields2.price)
			expect(response.body.map((option: IOption) => option.createdAt)).to.have.lengthOf(2)
			expect(response.body.map((option: IOption) => option.updatedAt)).to.have.lengthOf(2)
			expect(response.body.map((option: IOption) => option._id)).to.have.lengthOf(2)
		})

		it('should return an empty array if no options exist', async function () {
			await OptionModel.deleteMany({})

			const response = await agent().get('/api/v1/options').set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
			expect(response.body).to.be.an('array')
			expect(response.body).to.have.length(0)
		})
	})

	describe('PATCH /v1/options/:id', function () {
		let testOption1: IOption

		const testOptionFields1 = {
			name: 'Option 1',
			imageURL: 'https://example.com/image1.jpg',
			price: 10
		}

		const testOptionFields2 = {
			name: 'Option 2',
			imageURL: 'https://example.com/image2.jpg',
			price: 20
		}

		beforeEach(async function () {
			testOption1 = await OptionModel.create(testOptionFields1)
			await OptionModel.create(testOptionFields2)
		})

		it('should have status 200', async function () {
			const updatedFields = {
				name: 'Updated Option 1',
				imageURL: 'https://example.com/imageNew.jpg',
				price: 15
			}

			const response = await agent().patch(`/api/v1/options/${testOption1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const updatedFields = {
				name: 'Updated Option 1',
				imageURL: 'https://example.com/imageNew.jpg',
				price: 15
			}

			const response = await agent().patch(`/api/v1/options/${testOption1.id}`).send(updatedFields)

			expect(response).to.have.status(403)
		})

		it('should update an option', async function () {
			const updatedFields = {
				name: 'Updated Option 1',
				imageURL: 'https://example.com/imageNew.jpg',
				price: 15
			}

			await agent().patch(`/api/v1/options/${testOption1.id}`).send(updatedFields).set('Cookie', sessionCookie)
			const option = await OptionModel.findById(testOption1.id)
			expect(option).to.exist
			expect(option).to.have.property('name', updatedFields.name)
			expect(option).to.have.property('imageURL', updatedFields.imageURL)
			expect(option).to.have.property('price', updatedFields.price)
		})

		it('should return the patched option', async function () {
			const updatedFields = {
				name: 'Updated Option 1',
				imageURL: 'https://example.com/imageNew.jpg',
				price: 15
			}

			const response = await agent().patch(`/api/v1/options/${testOption1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response.body).to.have.property('name', updatedFields.name)
			expect(response.body).to.have.property('imageURL', updatedFields.imageURL)
			expect(response.body).to.have.property('price', updatedFields.price)
			expect(response.body).to.have.property('createdAt')
			expect(response.body).to.have.property('updatedAt')
			expect(response.body).to.have.property('_id')
		})

		it('should allow a partial update', async function () {
			const updatedFields = {
				name: 'Updated Option 1'
			}

			await agent().patch(`/api/v1/options/${testOption1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const option = await OptionModel.findById(testOption1.id)

			expect(option?.name).to.equal(updatedFields.name)
		})

		it('should patch a field which is not present', async function () {
			await OptionModel.findByIdAndUpdate(testOption1.id, { $unset: { imageURL: 1 } })
			const updatedFields = {
				imageURL: 'https://example.com/imageNew.jpg'
			}

			await agent().patch(`/api/v1/options/${testOption1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const option = await OptionModel.findById(testOption1.id)

			expect(option?.imageURL).to.equal(updatedFields.imageURL)
		})

		it('should return 404 if the option does not exist', async function () {
			const updatedFields = {
				name: 'Updated Option 1',
				imageURL: 'https://example.com/imageNew.jpg',
				price: 15
			}

			const response = await agent().patch(`/api/v1/options/${new mongoose.Types.ObjectId().toString()}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
			expect(response.body).to.have.property('error', 'Tilvalg ikke fundet')
		})

		it('should return an error if the request is invalid', async function () {
			const updatedFields = {
				name: 'Updated Option 1',
				imageURL: 'https://example.com/imageNew.jpg',
				price: -15
			}

			const response = await agent().patch(`/api/v1/options/${testOption1.id}`).send(updatedFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error')
		})

		it('should not allow updating the _id', async function () {
			const updatedFields = {
				_id: new mongoose.Types.ObjectId().toString()
			}

			await agent().patch(`/api/v1/options/${testOption1.id}`).send(updatedFields).set('Cookie', sessionCookie)
			const option = await OptionModel.findById(testOption1.id)
			expect(option?.id.toString()).to.equal(testOption1.id)
		})
	})

	describe('DELETE /v1/options/:id', function () {
		let testOption1: IOption

		const testOptionFields1 = {
			name: 'Option 1',
			price: 10
		}

		const testOptionFields2 = {
			name: 'Option 2',
			price: 20
		}

		beforeEach(async function () {
			testOption1 = await OptionModel.create(testOptionFields1)
			await OptionModel.create(testOptionFields2)
		})

		it('should have status 204', async function () {
			const response = await agent().delete(`/api/v1/options/${testOption1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response).to.have.status(204)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().delete(`/api/v1/options/${testOption1.id}`).send({ confirm: true })

			expect(response).to.have.status(403)
		})

		it('should delete an option', async function () {
			const response = await agent().delete(`/api/v1/options/${testOption1.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response.body).to.be.empty
			const product = await OptionModel.findById(testOption1.id)
			expect(product).to.not.exist
		})

		it('should return 404 if the option does not exist', async function () {
			const response = await agent().delete(`/api/v1/options/${new mongoose.Types.ObjectId().toString()}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(response).to.have.status(404)
			expect(response.body).to.have.property('error', 'Tilvalg ikke fundet')
		})

		it('should return an error if confirm false', async function () {
			const response = await agent().delete(`/api/v1/options/${testOption1.id}`).send({ confirm: false }).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error', 'Kræver konfirmering')
		})

		it('should return an error if confirm is not a boolean', async function () {
			const response = await agent().delete(`/api/v1/options/${testOption1.id}`).send({ confirm: 'true' }).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error', 'Kræver konfirmering')
		})

		it('should return an error if confirm is not present', async function () {
			const response = await agent().delete(`/api/v1/options/${testOption1.id}`).set('Cookie', sessionCookie)

			expect(response).to.have.status(400)
			expect(response.body).to.have.property('error', 'Kræver konfirmering')
		})
	})
})
