/* eslint-disable local/enforce-comment-order */
/* eslint-disable typescript/no-unused-vars */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'

// Own modules
import OptionModel from '../../../app/models/Option.js'
import ProductModel from '../../../app/models/Product.js'

// Setup test environment
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
		} catch (err) {
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
		} catch (err) {
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
		} catch (err) {
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
		} catch (err) {
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

		describe('Pre-delete middleware', function () {
			it('should remove the option from any products when deleted', async function () {
				const option = await OptionModel.create(testOptionFields)
				const product = await ProductModel.create({...testProductFields, options: [option._id]})
		
				await OptionModel.deleteOne({ _id: option._id })
		
				const updatedProduct = await ProductModel.findById(product._id)
				expect(updatedProduct?.options).to.be.empty
			})

			it('should not remove other options from the product when deleting an option', async function () {
				const option1 = await OptionModel.create(testOptionFields)
				const option2 = await OptionModel.create(testOptionFields)
				const product = await ProductModel.create({...testProductFields, options: [option1._id, option2._id]})
		
				await OptionModel.deleteOne({ _id: option1._id })
		
				const updatedProduct = await ProductModel.findById(product._id)
				expect(updatedProduct?.options).to.have.lengthOf(1)
			})

			it('should remove the option from any orders when deleting a option', async function () {
				const option = await OptionModel.create(testOptionFields)
				const product = await ProductModel.create(testProductFields)
		
				await ProductModel.findByIdAndUpdate(product._id, { $push: { options: option._id } })
		
				await OptionModel.deleteOne({ _id: option._id })
		
				const updatedProduct = await ProductModel.findById(product._id)
				expect(updatedProduct?.options).to.be.empty
			})
		})

		describe('Pre-delete-many middleware', function () {
			it('should remove the options from any products when deleted', async function () {
				const option1 = await OptionModel.create(testOptionFields)
				const option2 = await OptionModel.create(testOptionFields)
				const product = await ProductModel.create({...testProductFields, options: [option1._id, option2._id]})
		
				await OptionModel.deleteMany({ _id: { $in: [option1._id, option2._id] } })
		
				const updatedProduct = await ProductModel.findById(product._id)

				expect(updatedProduct?.options).to.be.empty
			})

			it('should not remove other options from the product when deleting options', async function () {
				const option1 = await OptionModel.create(testOptionFields)
				const option2 = await OptionModel.create(testOptionFields)
				const product = await ProductModel.create({...testProductFields, options: [option1._id, option2._id]})
		
				await OptionModel.deleteMany({ _id: option1._id })
		
				const updatedProduct = await ProductModel.findById(product._id)
				expect(updatedProduct?.options).to.have.lengthOf(1)
			})

			it('should remove the options from any orders when deleting options', async function () {
				const option1 = await OptionModel.create(testOptionFields)
				const option2 = await OptionModel.create(testOptionFields)
				const product = await ProductModel.create(testProductFields)
				
				await OptionModel.deleteMany({ _id: { $in: [option1._id, option2._id] } })
		
				const updatedProduct = await ProductModel.findById(product._id)
				expect(updatedProduct?.options).to.be.empty
			})
		})
	})
})
