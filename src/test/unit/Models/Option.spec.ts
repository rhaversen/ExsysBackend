/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'

import OptionModel from '../../../app/models/Option.js'
import ProductModel from '../../../app/models/Product.js'

import '../../testSetup.js'

describe('Option Model', function () {
	let testOptionFields: {
		name: string
		imageURL: string
		price: number
	}

	beforeEach(async function () {
		testOptionFields = {
			name: 'TestOption',
			imageURL: 'https://example.com/image.jpg',
			price: 100
		}
	})

	it('should create a valid order', async function () {
		const option = await OptionModel.create(testOptionFields)
		expect(option).to.exist
		expect(option.name).to.equal(testOptionFields.name)
		expect(option.imageURL).to.equal(testOptionFields.imageURL)
		expect(option.price).to.equal(testOptionFields.price)
	})

	it('should trim the name', async function () {
		const option = await OptionModel.create({
			...testOptionFields,
			name: '  TestOption  '
		})
		expect(option).to.exist
		expect(option.name).to.equal('TestOption')
	})

	it('should trim the imageURL', async function () {
		const option = await OptionModel.create({
			...testOptionFields,
			imageURL: '  https://example.com/image.jpg  '
		})
		expect(option).to.exist
		expect(option.imageURL).to.equal('https://example.com/image.jpg')
	})

	it('should create an option with a non-integer price', async function () {
		const option = await OptionModel.create({
			...testOptionFields,
			price: 100.5
		})
		expect(option).to.exist
		expect(option.price).to.equal(100.5)
	})

	it('should create an option with no image URL', async function () {
		const option = await OptionModel.create({
			...testOptionFields,
			imageURL: undefined
		})
		expect(option).to.exist
		expect(option.imageURL).to.be.undefined
	})

	it('should not create an option with no name', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				name: undefined
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create an option with no price', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				price: undefined
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should create an option with a price of 0', async function () {
		const option = await OptionModel.create({
			...testOptionFields,
			price: 0
		})
		expect(option).to.exist
		expect(option.price).to.equal(0)
	})

	it('should not create an option with a negative price', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				price: -1
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create an option with a too long name', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				name: 'a'.repeat(21)
			})
		} catch {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	describe('Delete middleware', function () {
		const testProductFields = {
			name: 'Test Product',
			price: 100,
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			},
			options: []
		}

		describe('Pre-delete middleware (deleteOne / findOneAndDelete)', function () {
			it('should remove the option from Product.options when deleted', async function () {
				const option = await OptionModel.create(testOptionFields)
				const product = await ProductModel.create({ ...testProductFields, options: [option._id] })

				await OptionModel.deleteOne({ _id: option._id })

				const updatedProduct = await ProductModel.findById(product._id)
				expect(updatedProduct?.options).to.be.empty
			})

			it('should not remove other options from Product.options when deleting an option', async function () {
				const option1 = await OptionModel.create(testOptionFields)
				const option2 = await OptionModel.create({ ...testOptionFields, name: 'TestOption2' }) // Use unique name
				const product = await ProductModel.create({ ...testProductFields, options: [option1._id, option2._id] })

				await OptionModel.deleteOne({ _id: option1._id })

				const updatedProduct = await ProductModel.findById(product._id)
				expect(updatedProduct?.options).to.have.lengthOf(1)
				expect(updatedProduct?.options?.[0].toString()).to.equal(option2._id.toString())
			})
		})

		describe('Pre-delete-many middleware', function () {
			it('should remove the options from Product.options when deleted via deleteMany', async function () {
				const option1 = await OptionModel.create(testOptionFields)
				const option2 = await OptionModel.create({ ...testOptionFields, name: 'TestOption2' }) // Use unique name
				const product = await ProductModel.create({ ...testProductFields, options: [option1._id, option2._id] })

				await OptionModel.deleteMany({ _id: { $in: [option1._id, option2._id] } })

				const updatedProduct = await ProductModel.findById(product._id)

				expect(updatedProduct?.options).to.be.empty
			})

			it('should not remove other options from Product.options when deleting options via deleteMany', async function () {
				const option1 = await OptionModel.create(testOptionFields)
				const option2 = await OptionModel.create({ ...testOptionFields, name: 'TestOption2' }) // Use unique name
				const option3 = await OptionModel.create({ ...testOptionFields, name: 'TestOption3' }) // Use unique name
				const product = await ProductModel.create({ ...testProductFields, options: [option1._id, option2._id, option3._id] })

				await OptionModel.deleteMany({ _id: { $in: [option1._id, option2._id] } })

				const updatedProduct = await ProductModel.findById(product._id)
				expect(updatedProduct?.options).to.have.lengthOf(1)
				expect(updatedProduct?.options?.[0].toString()).to.equal(option3._id.toString())
			})
		})
	})
})
