// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import bcrypt from 'bcrypt'

// Own modules
import AdminModel from '../../app/models/Admin.js'

// Setup test environment
import '../testSetup.js'

describe('Admin Model', function () {
	const testAdminFields = {
		name: 'TestAdmin',
		email: 'test@admin.com',
		password: 'testPassword'
	}

	it('should create a valid admin', async function () {
		const admin = await AdminModel.create(testAdminFields)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(admin).to.exist
		expect(admin.name).to.equal(testAdminFields.name)
		expect(admin.email).to.equal(testAdminFields.email)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(await bcrypt.compare(testAdminFields.password, admin.password)).to.be.true
	})

	it('should trim the name', async function () {
		const admin = await AdminModel.create({
			...testAdminFields,
			name: '  TestAdmin  '
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(admin).to.exist
		expect(admin.name).to.equal('TestAdmin')
	})

	it('should trim the email', async function () {
		const admin = await AdminModel.create({
			...testAdminFields,
			email: '    test@admin.com    '
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(admin).to.exist
		expect(admin.email).to.equal('test@admin.com')
	})

	it('should trim the password', async function () {
		const admin = await AdminModel.create({
			...testAdminFields,
			password: '  testPassword  '
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(admin).to.exist
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not save an admin with a too short email', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create({
				...testAdminFields,
				email: 'a'
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not save an admin with a too long email', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create({
				...testAdminFields,
				email: 'a'.repeat(101) + '@a.com'
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not save an admin with an invalid email', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create({
				...testAdminFields,
				email: 'invalidEmail'
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not save an admin with a too short password', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create({
				...testAdminFields,
				password: 'a'
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not save an admin with a duplicate email', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create(testAdminFields)
			await AdminModel.create(testAdminFields)
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should set the email to lowercase', async function () {
		const admin = await AdminModel.create({
			...testAdminFields,
			email: 'Test@Email.Com'
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(admin).to.exist
		expect(admin.email).to.equal('test@email.com')
	})

	it('should save an admin without a name', async function () {
		const admin = await AdminModel.create({
			...testAdminFields,
			name: undefined
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(admin).to.exist
	})

	it('should not save an admin without an email', async function () {
		let errorOccurred = false
		try {
			await AdminModel.create({
				...testAdminFields,
				email: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should hash the password', async function () {
		const admin = await AdminModel.create(testAdminFields)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(admin).to.exist
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(admin.password).to.not.equal(testAdminFields.password)
	})
})
