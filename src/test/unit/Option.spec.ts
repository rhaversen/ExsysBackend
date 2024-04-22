// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'

// Own modules
import OptionModel from '../../app/models/Option.js'

// Setup test environment
import '../testSetup.js'

describe('Option Model', function () {
	let testOptionFields: {
		optionName: string
		price: number
		description: string
		availability: number
		maxOrderQuantity: number
	}

	beforeEach(async function () {
		testOptionFields = {
			optionName: 'TestOption',
			price: 100,
			description: 'TestDescription',
			availability: 10,
			maxOrderQuantity: 5
		}
	})

	it('should create a valid order', async function () {
		const option = await OptionModel.create(testOptionFields)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(option).to.exist
		expect(option.optionName).to.equal(testOptionFields.optionName)
		expect(option.price).to.equal(testOptionFields.price)
		expect(option.description).to.equal(testOptionFields.description)
		expect(option.availability).to.equal(testOptionFields.availability)
		expect(option.maxOrderQuantity).to.equal(testOptionFields.maxOrderQuantity)
	})

	it('should create an option with a non-integer price', async function () {
		const option = await OptionModel.create({
			...testOptionFields,
			price: 100.5
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(option).to.exist
		expect(option.price).to.equal(100.5)
	})

	it('should not create an option with a non-integer availability', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				availability: 10.5
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create an option with a non-integer maxOrderQuantity', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				maxOrderQuantity: 5.5
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create an option with no name', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				optionName: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should create an option with a price of 0', async function () {
		const option = await OptionModel.create({
			...testOptionFields,
			price: 0
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(option).to.exist
		expect(option.price).to.equal(0)
	})

	it('should not create an option with no description', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				description: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create an option with no availability', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				availability: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create an option with no maxOrderQuantity', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				maxOrderQuantity: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
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
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create an option with a negative availability', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				availability: -1
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create an option with a negative maxOrderQuantity', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				maxOrderQuantity: -1
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create an option with zero maxOrderQuantity', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				maxOrderQuantity: 0
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create an option with a too long optionName', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				optionName: 'a'.repeat(21)
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create an option with a too long description', async function () {
		let errorOccurred = false
		try {
			await OptionModel.create({
				...testOptionFields,
				description: 'a'.repeat(51)
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})
})
