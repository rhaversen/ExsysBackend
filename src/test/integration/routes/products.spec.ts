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
		imageURL: string
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
		options?: Types.ObjectId[]
	}

	beforeEach(async function () {
		testOption = await OptionModel.create({
			name: 'Test Option',
			imageURL: 'https://example.com/image.jpg',
			price: 50
		})

		testProductFields = {
			name: 'Test Product',
			price: 100,
			imageURL: 'https://example.com/image.jpg',
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
			options: [testOption.id]
		}
	})

	it('should create a valid product', async function () {
		await agent.post('/v1/products').send(testProductFields)
		const order = await ProductModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.exist
		expect(order?.name).to.equal(testProductFields.name)
		expect(order?.imageURL).to.equal(testProductFields.imageURL)
		expect(order?.price).to.equal(testProductFields.price)
		expect(order?.orderWindow.from.hour).to.equal(testProductFields.orderWindow.from.hour)
		expect(order?.orderWindow.from.minute).to.equal(testProductFields.orderWindow.from.minute)
		expect(order?.orderWindow.to.hour).to.equal(testProductFields.orderWindow.to.hour)
		expect(order?.orderWindow.to.minute).to.equal(testProductFields.orderWindow.to.minute)
		expect(order?.options?.[0].toString()).to.equal(testOption.id)
	})

	it('should return the product', async function () {
		const res = await agent.post('/v1/products').send(testProductFields)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body.name).to.equal(testProductFields.name)
		expect(res.body.imageURL).to.equal(testProductFields.imageURL)
		expect(res.body.price).to.equal(testProductFields.price)
		expect(res.body.orderWindow.from.hour).to.equal(testProductFields.orderWindow.from.hour)
		expect(res.body.orderWindow.from.minute).to.equal(testProductFields.orderWindow.from.minute)
		expect(res.body.orderWindow.to.hour).to.equal(testProductFields.orderWindow.to.hour)
		expect(res.body.orderWindow.to.minute).to.equal(testProductFields.orderWindow.to.minute)
		expect(res.body.options[0].toString()).to.equal(testOption.id)
	})

	it('should create a valid product with two options', async function () {
		const testOption2 = await OptionModel.create({
			name: 'Test Option 2',
			imageURL: 'https://example.com/imageNew.jpg',
			price: 50
		})

		testProductFields.options?.push(testOption2.id as Types.ObjectId)

		await agent.post('/v1/products').send(testProductFields)
		const order = await ProductModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.exist
		expect(order?.name).to.equal(testProductFields.name)
		expect(order?.imageURL).to.equal(testProductFields.imageURL)
		expect(order?.price).to.equal(testProductFields.price)
		expect(order?.orderWindow.from.hour).to.equal(testProductFields.orderWindow.from.hour)
		expect(order?.orderWindow.from.minute).to.equal(testProductFields.orderWindow.from.minute)
		expect(order?.orderWindow.to.hour).to.equal(testProductFields.orderWindow.to.hour)
		expect(order?.orderWindow.to.minute).to.equal(testProductFields.orderWindow.to.minute)
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
			imageURL: 'https://example.com/image.jpg',
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			}
		})
	})

	it('should return a product', async function () {
		const res = await agent.get('/v1/products')
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body).to.be.an('array')
		expect(res.body).to.have.lengthOf(1)
		expect(res.body[0].name).to.equal(testProduct.name)
		expect(res.body[0].imageURL).to.equal(testProduct.imageURL)
		expect(res.body[0].price).to.equal(testProduct.price)
		expect(res.body[0].orderWindow.from.hour).to.equal(testProduct.orderWindow.from.hour)
		expect(res.body[0].orderWindow.from.minute).to.equal(testProduct.orderWindow.from.minute)
		expect(res.body[0].orderWindow.to.hour).to.equal(testProduct.orderWindow.to.hour)
		expect(res.body[0].orderWindow.to.minute).to.equal(testProduct.orderWindow.to.minute)
	})

	it('should get all products', async function () {
		await ProductModel.create({
			name: 'Test Product 2',
			imageURL: 'https://example.com/image2.jpg',
			price: 200,
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			}
		})

		const res = await agent.get('/v1/products')
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body).to.be.an('array')
		expect(res.body).to.have.lengthOf(2)
		expect(res.body[0].name).to.equal(testProduct.name)
		expect(res.body[0].imageURL).to.equal(testProduct.imageURL)
		expect(res.body[1].name).to.equal('Test Product 2')
		expect(res.body[1].imageURL).to.equal('https://example.com/image2.jpg')
	})
})

describe('PATCH /v1/products/:id', function () {
	let testProduct: IProduct

	beforeEach(async function () {
		testProduct = await ProductModel.create({
			name: 'Test Product',
			imageURL: 'https://example.com/image.jpg',
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
			}
		})
	})

	it('should update a product', async function () {
		const res = await agent.patch(`/v1/products/${testProduct.id}`).send({
			name: 'Updated Product',
			imageURL: 'https://example.com/imageNew.jpg',
			price: 200,
			orderWindow: {
				from: {
					hour: 1,
					minute: 0
				},
				to: {
					hour: 22,
					minute: 59
				}
			}
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body.name).to.equal('Updated Product')
		expect(res.body.imageURL).to.equal('https://example.com/imageNew.jpg')
		expect(res.body.price).to.equal(200)
		expect(res.body.orderWindow.from.hour).to.equal(1)
		expect(res.body.orderWindow.from.minute).to.equal(0)
		expect(res.body.orderWindow.to.hour).to.equal(22)
		expect(res.body.orderWindow.to.minute).to.equal(59)
	})

	it('should allow a partial update', async function () {
		const res = await agent.patch(`/v1/products/${testProduct.id}`).send({
			name: 'Updated Product'
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body.name).to.equal('Updated Product')
		expect(res.body.imageURL).to.equal('https://example.com/image.jpg')
		expect(res.body.price).to.equal(100)
		expect(res.body.orderWindow.from.hour).to.equal(0)
		expect(res.body.orderWindow.from.minute).to.equal(0)
		expect(res.body.orderWindow.to.hour).to.equal(23)
		expect(res.body.orderWindow.to.minute).to.equal(59)
	})

	it('should update a product with an option', async function () {
		const testOption = await OptionModel.create({
			name: 'Test Option',
			imageURL: 'https://example.com/image.jpg',
			price: 50
		})

		const res = await agent.patch(`/v1/products/${testProduct.id}`).send({
			options: [testOption.id]
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body.name).to.equal('Test Product')
		expect(res.body.imageURL).to.equal('https://example.com/image.jpg')
		expect(res.body.price).to.equal(100)
		expect(res.body.orderWindow.from.hour).to.equal(0)
		expect(res.body.orderWindow.from.minute).to.equal(0)
		expect(res.body.orderWindow.to.hour).to.equal(23)
		expect(res.body.orderWindow.to.minute).to.equal(59)
		expect(res.body.options[0].toString()).to.equal(testOption.id)
	})

	it('should patch a field which is not present', async function () {
		await ProductModel.findByIdAndUpdate(testProduct.id, { $unset: { imageURL: 1 } })
		const updatedFields = {
			imageURL: 'https://example.com/imageNew.jpg'
		}

		const res = await agent.patch(`/v1/products/${testProduct.id}`).send(updatedFields)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res).to.have.status(200)
		expect(res.body.name).to.equal('Test Product')
		expect(res.body.imageURL).to.equal('https://example.com/imageNew.jpg')
		expect(res.body.price).to.equal(100)
		expect(res.body.orderWindow.from.hour).to.equal(0)
		expect(res.body.orderWindow.from.minute).to.equal(0)
		expect(res.body.orderWindow.to.hour).to.equal(23)
		expect(res.body.orderWindow.to.minute).to.equal(59)
	})

	it('should return a 404 if the product does not exist', async function () {
		const res = await agent.patch(`/v1/products/${new mongoose.Types.ObjectId().toString()}`).send({
			name: 'Updated Product',
			imageURL: 'https://example.com/imageNew.jpg',
			price: 200,
			orderWindow: {
				from: {
					hour: 1,
					minute: 0
				},
				to: {
					hour: 22,
					minute: 59
				}
			}
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
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			}
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
