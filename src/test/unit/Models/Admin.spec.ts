/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import bcrypt from 'bcrypt'

// Own modules
import AdminModel from '../../../app/models/Admin.js'

// Setup test environment
import '../../testSetup.js'

describe('Admin Model', function () {
	const testAdminFields = {
		name: 'TestAdmin',
		password: 'testPassword'
	}

	it('should create a valid admin', async function () {
		const admin = await AdminModel.create(testAdminFields)
		expect(admin).to.exist
		expect(admin.name).to.equal(testAdminFields.name)
		expect(await bcrypt.compare(testAdminFields.password, admin.password)).to.be.true
	})

	it('should trim the name', async function () {
		const admin = await AdminModel.create({
			...testAdminFields,
			name: '  TestAdmin  '
		})
		expect(admin).to.exist
		expect(admin.name).to.equal('TestAdmin')
	})

	it('should trim the password', async function () {
		const admin = await AdminModel.create({
			...testAdminFields,
			password: '  testPassword  '
		})
		expect(admin).to.exist
		expect(await bcrypt.compare('testPassword', admin.password)).to.be.true
	})

	it('should not save an admin with a too short name', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create({
				...testAdminFields,
				name: 'a'
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not save an admin with a too long name', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create({
				...testAdminFields,
				name: 'a'.repeat(51)
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not save an admin with a too long password', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create({
				...testAdminFields,
				password: 'a'.repeat(101)
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not save an admin with a duplicate name', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create(testAdminFields)
			await AdminModel.create(testAdminFields)
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not save an admin without a name', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create({
				...testAdminFields,
				name: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not save an admin without a password', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create({
				...testAdminFields,
				password: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should hash the password', async function () {
		const admin = await AdminModel.create(testAdminFields)
		expect(admin).to.exist
		expect(admin.password).to.not.equal(testAdminFields.password)
	})
})
