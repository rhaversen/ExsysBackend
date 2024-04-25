// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose, { type Types } from 'mongoose'
import { chaiAppServer as agent } from '../../testSetup.js'

// Own modules
import OptionModel, { type IOption } from '../../../app/models/Option.js'
import ProductModel, { type IProduct } from '../../../app/models/Product.js'

describe('POST /v1/products', function () {
	let testOption: IOption

	let testProductFields: {
		name: string
		price: number
		description: string
		availability: number
		orderWindow: {
			from: {
				hour: number
				minute: number
			}
			to: {
				hour: number
				minute: number
			}
		}
		maxOrderQuantity: number
		options?: Types.ObjectId[]
	}

	beforeEach(async function () {
		testOption = await OptionModel.create({
			name: 'Test Option',
			price: 50,
			description: 'A test option',
			availability: 100,
			maxOrderQuantity: 10
		})

		testProductFields = {
			name: 'Test Product',
			price: 100,
			description: 'A test product',
			availability: 100,
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
			maxOrderQuantity: 10,
			options: [testOption.id]
		}
	})

	it('should create a valid product', async function () {
		await agent.post('/v1/products').send(testProductFields)
		const order = await ProductModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.exist
		expect(order?.name).to.equal(testProductFields.name)
		expect(order?.price).to.equal(testProductFields.price)
		expect(order?.description).to.equal(testProductFields.description)
		expect(order?.availability).to.equal(testProductFields.availability)
		expect(order?.orderWindow.from.hour).to.equal(testProductFields.orderWindow.from.hour)
		expect(order?.orderWindow.from.minute).to.equal(testProductFields.orderWindow.from.minute)
		expect(order?.orderWindow.to.hour).to.equal(testProductFields.orderWindow.to.hour)
		expect(order?.orderWindow.to.minute).to.equal(testProductFields.orderWindow.to.minute)
		expect(order?.maxOrderQuantity).to.equal(testProductFields.maxOrderQuantity)
		expect(order?.options?.[0].toString()).to.equal(testOption.id)
	})

	it('should return the product', async function () {
		const res = await agent.post('/v1/products').send(testProductFields)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body.name).to.equal(testProductFields.name)
		expect(res.body.price).to.equal(testProductFields.price)
		expect(res.body.description).to.equal(testProductFields.description)
		expect(res.body.availability).to.equal(testProductFields.availability)
		expect(res.body.orderWindow.from.hour).to.equal(testProductFields.orderWindow.from.hour)
		expect(res.body.orderWindow.from.minute).to.equal(testProductFields.orderWindow.from.minute)
		expect(res.body.orderWindow.to.hour).to.equal(testProductFields.orderWindow.to.hour)
		expect(res.body.orderWindow.to.minute).to.equal(testProductFields.orderWindow.to.minute)
		expect(res.body.maxOrderQuantity).to.equal(testProductFields.maxOrderQuantity)
		expect(res.body.options[0].toString()).to.equal(testOption.id)
	})

	it('should create a valid product with two options', async function () {
		const testOption2 = await OptionModel.create({
			name: 'Test Option 2',
			price: 50,
			description: 'A test option',
			availability: 100,
			maxOrderQuantity: 10
		})

		testProductFields.options?.push(testOption2.id as Types.ObjectId)

		await agent.post('/v1/products').send(testProductFields)
		const order = await ProductModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.exist
		expect(order?.name).to.equal(testProductFields.name)
		expect(order?.price).to.equal(testProductFields.price)
		expect(order?.description).to.equal(testProductFields.description)
		expect(order?.availability).to.equal(testProductFields.availability)
		expect(order?.orderWindow.from.hour).to.equal(testProductFields.orderWindow.from.hour)
		expect(order?.orderWindow.from.minute).to.equal(testProductFields.orderWindow.from.minute)
		expect(order?.orderWindow.to.hour).to.equal(testProductFields.orderWindow.to.hour)
		expect(order?.orderWindow.to.minute).to.equal(testProductFields.orderWindow.to.minute)
		expect(order?.maxOrderQuantity).to.equal(testProductFields.maxOrderQuantity)
		expect(order?.options?.[0].toString()).to.equal(testOption.id)
		expect(order?.options?.[1].toString()).to.equal(testOption2.id)
	})
})

describe('GET /v1/products', function () {
	let testProduct: IProduct

	beforeEach(async function () {
		testProduct = await ProductModel.create({
			name: 'Test Product',
			price: 100,
			description: 'A test product',
			availability: 100,
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
			maxOrderQuantity: 10
		})
	})

	it('should return a product', async function () {
		const res = await agent.get('/v1/products')
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body).to.be.an('array')
		expect(res.body).to.have.lengthOf(1)
		expect(res.body[0].name).to.equal(testProduct.name)
		expect(res.body[0].price).to.equal(testProduct.price)
		expect(res.body[0].description).to.equal(testProduct.description)
		expect(res.body[0].availability).to.equal(testProduct.availability)
		expect(res.body[0].orderWindow.from.hour).to.equal(testProduct.orderWindow.from.hour)
		expect(res.body[0].orderWindow.from.minute).to.equal(testProduct.orderWindow.from.minute)
		expect(res.body[0].orderWindow.to.hour).to.equal(testProduct.orderWindow.to.hour)
		expect(res.body[0].orderWindow.to.minute).to.equal(testProduct.orderWindow.to.minute)
		expect(res.body[0].maxOrderQuantity).to.equal(testProduct.maxOrderQuantity)
	})

	it('should get all products', async function () {
		await ProductModel.create({
			name: 'Test Product 2',
			price: 200,
			description: 'A test product 2',
			availability: 100,
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
			maxOrderQuantity: 10
		})

		const res = await agent.get('/v1/products')
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body).to.be.an('array')
		expect(res.body).to.have.lengthOf(2)
		expect(res.body[0].name).to.equal(testProduct.name)
		expect(res.body[1].name).to.equal('Test Product 2')
	})
})

describe('PATCH /v1/products/:id', function () {
	let testProduct: IProduct

	beforeEach(async function () {
		testProduct = await ProductModel.create({
			name: 'Test Product',
			price: 100,
			description: 'A test product',
			availability: 100,
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
			maxOrderQuantity: 10
		})
	})

	it('should update a product', async function () {
		const res = await agent.patch(`/v1/products/${testProduct.id}`).send({
			name: 'Updated Product',
			price: 200,
			description: 'An updated product',
			availability: 50,
			orderWindow: {
				from: {
					hour: 1,
					minute: 0
				},
				to: {
					hour: 22,
					minute: 59
				}
			},
			maxOrderQuantity: 5
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body.name).to.equal('Updated Product')
		expect(res.body.price).to.equal(200)
		expect(res.body.description).to.equal('An updated product')
		expect(res.body.availability).to.equal(50)
		expect(res.body.orderWindow.from.hour).to.equal(1)
		expect(res.body.orderWindow.from.minute).to.equal(0)
		expect(res.body.orderWindow.to.hour).to.equal(22)
		expect(res.body.orderWindow.to.minute).to.equal(59)
		expect(res.body.maxOrderQuantity).to.equal(5)
	})

	it('should allow a partial update', async function () {
		const res = await agent.patch(`/v1/products/${testProduct.id}`).send({
			name: 'Updated Product'
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body.name).to.equal('Updated Product')
		expect(res.body.price).to.equal(100)
		expect(res.body.description).to.equal('A test product')
		expect(res.body.availability).to.equal(100)
		expect(res.body.orderWindow.from.hour).to.equal(0)
		expect(res.body.orderWindow.from.minute).to.equal(0)
		expect(res.body.orderWindow.to.hour).to.equal(23)
		expect(res.body.orderWindow.to.minute).to.equal(59)
		expect(res.body.maxOrderQuantity).to.equal(10)
	})

	it('should return a 404 if the product does not exist', async function () {
		const res = await agent.patch(`/v1/products/${new mongoose.Types.ObjectId().toString()}`).send({
			name: 'Updated Product',
			price: 200,
			description: 'An updated product',
			availability: 50,
			orderWindow: {
				from: {
					hour: 1,
					minute: 0
				},
				to: {
					hour: 22,
					minute: 59
				}
			},
			maxOrderQuantity: 5
		})
		expect(res.status).to.equal(404)
	})
})

describe('DELETE /v1/products/:id', function () {
	let testProduct: IProduct

	beforeEach(async function () {
		testProduct = await ProductModel.create({
			name: 'Test Product',
			price: 100,
			description: 'A test product',
			availability: 100,
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
			maxOrderQuantity: 10
		})
	})

	it('should delete a product', async function () {
		const res = await agent.delete(`/v1/products/${testProduct.id}`).send({ confirm: true })

		expect(res.status).to.equal(204)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.be.empty
		const product = await ProductModel.findById(testProduct.id)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(product).to.not.exist
	})

	it('should return a 400 if the confirm field is set to false', async function () {
		const res = await agent.delete(`/v1/products/${testProduct.id}`).send({ confirm: false })
		expect(res.status).to.equal(400)
	})

	it('should return a 400 if the confirm field is not set', async function () {
		const res = await agent.delete(`/v1/products/${testProduct.id}`)
		expect(res.status).to.equal(400)
	})

	it('should return a 400 if the confirm field is not a boolean', async function () {
		const res = await agent.delete(`/v1/products/${testProduct.id}`).send({ confirm: 'true' })
		expect(res.status).to.equal(400)
	})

	it('should return a 404 if the product does not exist', async function () {
		const res = await agent.delete('/v1/products/123456789012345678901234').send({ confirm: true })
		expect(res.status).to.equal(404)
	})
})
