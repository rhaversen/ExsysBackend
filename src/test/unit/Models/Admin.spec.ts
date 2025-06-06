/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import bcrypt from 'bcrypt'
import { expect } from 'chai'
import { describe, it } from 'mocha'

import AdminModel from '../../../app/models/Admin.js'

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

	it('should not save an admin with a too long name', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create({
				...testAdminFields,
				name: 'a'.repeat(51)
			})
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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

	it('should compare the password', async function () {
		const admin = await AdminModel.create(testAdminFields)
		expect(admin).to.exist
		expect(await admin.comparePassword(testAdminFields.password)).to.be.true
	})

	it('should not compare the wrong password', async function () {
		const admin = await AdminModel.create(testAdminFields)
		expect(admin).to.exist
		expect(await admin.comparePassword('wrongPassword')).to.be.false
	})
})
