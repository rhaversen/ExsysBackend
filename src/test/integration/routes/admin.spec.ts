// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { chaiAppServer as agent } from '../../testSetup.js'

// Own modules
import AdminModel from '../../../app/models/Admin.js'

describe('POST /v1/admins', function () {
	const testAdminFields1 = {
		name: 'admin1',
		email: 'test@email.com',
		password: 'password1',
		confirmPassword: 'password1'
	}

	it('should create a new admin', async function () {
		await agent.post('/v1/admins').send(testAdminFields1)

		const admin = await AdminModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(admin).to.exist
		expect(admin).to.have.property('name', testAdminFields1.name)
	})

	it('should return the newly created object', async function () {
		const response = await agent.post('/v1/admins').send(testAdminFields1)

		expect(response).to.have.status(201)
		expect(response.body).to.have.property('name', testAdminFields1.name)
	})

	it('should not require a name', async function () {
		const response = await agent.post('/v1/admins').send({
			...testAdminFields1,
			name: undefined
		})
		expect(response).to.have.status(201)
	})

	it('should not return the password', async function () {
		const response = await agent.post('/v1/admins').send(testAdminFields1)

		expect(response.body).to.not.have.property('password')
	})

	it('should return an error if the passwords do not match', async function () {
		const response = await agent.post('/v1/admins').send({
			...testAdminFields1,
			confirmPassword: 'password2'
		})

		expect(response).to.have.status(400)
	})

	it('should return an error if the confirm password is missing', async function () {
		const response = await agent.post('/v1/admins').send({
			...testAdminFields1,
			confirmPassword: undefined
		})

		expect(response).to.have.status(400)
	})
})

describe('GET /v1/admins', function () {
	const testAdminFields1 = {
		name: 'admin1',
		email: 'test1@email.com',
		password: 'password1',
		confirmPassword: 'password1'
	}

	const testAdminFields2 = {
		name: 'admin2',
		email: 'test2@email.com',
		password: 'password2',
		confirmPassword: 'password2'
	}

	beforeEach(async function () {
		await AdminModel.create(testAdminFields1)
		await AdminModel.create(testAdminFields2)
	})

	it('should return all admins', async function () {
		const response = await agent.get('/v1/admins')

		expect(response).to.have.status(200)
		expect(response.body).to.be.an('array')
		expect(response.body).to.have.lengthOf(2)
		expect(response.body[0]).to.have.property('name', testAdminFields1.name)
		expect(response.body[0]).to.have.property('email', testAdminFields1.email)
		expect(response.body[1]).to.have.property('name', testAdminFields2.name)
		expect(response.body[1]).to.have.property('email', testAdminFields2.email)
	})

	it('should not send the password', async function () {
		const response = await agent.get('/v1/admins')

		expect(response.body[0]).to.not.have.property('password')
	})
})
