/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose, { type Types } from 'mongoose'

// Own modules
import OptionModel, { type IOption } from '../../../app/models/Option.js'
import ProductModel, { type IProduct } from '../../../app/models/Product.js'
import { chaiAppServer as agent } from '../../testSetup.js'
import AdminModel from '../../../app/models/Admin.js'

describe('Products routes', function () {
	let sessionCookie: string

	beforeEach(async function () {
		// Log the agent in to get a valid session
		const adminFields = {
			name: 'Agent Admin',
			password: 'agentPassword'
		}
		await AdminModel.create(adminFields)

		const response = await agent.post('/api/v1/auth/login-admin-local').send(adminFields)
		sessionCookie = response.headers['set-cookie']
	})

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

		it('should have status 201', async function () {
			const response = await agent.post('/api/v1/products').send(testProductFields).set('Cookie', sessionCookie)

			expect(response).to.have.status(201)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent.post('/api/v1/products').send(testProductFields)

			expect(response).to.have.status(403)
		})

		it('should create a valid product', async function () {
			await agent.post('/api/v1/products').send(testProductFields).set('Cookie', sessionCookie)
			const order = await ProductModel.findOne({})
			expect(order).to.exist
			expect(order?.name).to.equal(testProductFields.name)
			expect(order?.imageURL).to.equal(testProductFields.imageURL)
			expect(order?.price).to.equal(testProductFields.price)
			expect(order?.orderWindow.from.hour).to.equal(testProductFields.orderWindow.from.hour)
			expect(order?.orderWindow.from.minute).to.equal(testProductFields.orderWindow.from.minute)
			expect(order?.orderWindow.to.hour).to.equal(testProductFields.orderWindow.to.hour)
			expect(order?.orderWindow.to.minute).to.equal(testProductFields.orderWindow.to.minute)
			expect(order?.options?.[0].toString()).to.equal(testOption.id)
			expect(order).to.have.property('createdAt')
			expect(order).to.have.property('updatedAt')
		})

		it('should return the product', async function () {
			const res = await agent.post('/api/v1/products').send(testProductFields).set('Cookie', sessionCookie)
			expect(res.body).to.exist
			expect(res.body.name).to.equal(testProductFields.name)
			expect(res.body.imageURL).to.equal(testProductFields.imageURL)
			expect(res.body.price).to.equal(testProductFields.price)
			expect(res.body.orderWindow.from.hour).to.equal(testProductFields.orderWindow.from.hour)
			expect(res.body.orderWindow.from.minute).to.equal(testProductFields.orderWindow.from.minute)
			expect(res.body.orderWindow.to.hour).to.equal(testProductFields.orderWindow.to.hour)
			expect(res.body.orderWindow.to.minute).to.equal(testProductFields.orderWindow.to.minute)
			expect(res.body.options[0]._id.toString()).to.equal(testOption.id)
			expect(res.body).to.have.property('createdAt')
			expect(res.body).to.have.property('updatedAt')
			expect(res.body).to.have.property('_id')
		})

		it('should populate the options', async function () {
			const res = await agent.post('/api/v1/products').send(testProductFields).set('Cookie', sessionCookie)
			expect(res.body).to.exist
			expect(res.body.options).to.be.an('array')
			expect(res.body.options).to.have.lengthOf(1)
			expect(res.body.options[0].name).to.equal(testOption.name)
			expect(res.body.options[0].imageURL).to.equal(testOption.imageURL)
			expect(res.body.options[0].price).to.equal(testOption.price)
		})

		it('should create a valid product with two options', async function () {
			const testOption2 = await OptionModel.create({
				name: 'Test Option 2',
				imageURL: 'https://example.com/imageNew.jpg',
				price: 50
			})

			testProductFields.options?.push(testOption2.id as Types.ObjectId)

			await agent.post('/api/v1/products').send(testProductFields).set('Cookie', sessionCookie)
			const order = await ProductModel.findOne({})
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

		it('should not allow setting the _id', async function () {
			const newId = new mongoose.Types.ObjectId().toString()
			await agent.post('/api/v1/products').send({
				_id: newId,
				...testProductFields
			}).set('Cookie', sessionCookie)
			const product = await ProductModel.findOne({})
			expect(product?.id.toString()).to.not.equal(newId)
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

		it('should have status 200', async function () {
			const res = await agent.get('/api/v1/products').set('Cookie', sessionCookie)
			expect(res).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const res = await agent.get('/api/v1/products')
			expect(res).to.have.status(403)
		})

		it('should return a product', async function () {
			const res = await agent.get('/api/v1/products').set('Cookie', sessionCookie)
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
			expect(res.body[0]).to.have.property('createdAt')
			expect(res.body[0]).to.have.property('updatedAt')
			expect(res.body[0]).to.have.property('_id')
		})

		it('should populate the options', async function () {
			const testOption = await OptionModel.create({
				name: 'Test Option',
				imageURL: 'https://example.com/image.jpg',
				price: 50
			})

			await ProductModel.findByIdAndUpdate(testProduct.id, { options: [testOption.id] })

			const res = await agent.get('/api/v1/products').set('Cookie', sessionCookie)
			expect(res.body).to.exist
			expect(res.body).to.be.an('array')
			expect(res.body).to.have.lengthOf(1)
			expect(res.body[0].options).to.be.an('array')
			expect(res.body[0].options).to.have.lengthOf(1)
			expect(res.body[0].options[0].name).to.equal('Test Option')
			expect(res.body[0].options[0].imageURL).to.equal('https://example.com/image.jpg')
			expect(res.body[0].options[0].price).to.equal(50)
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

			const res = await agent.get('/api/v1/products').set('Cookie', sessionCookie)
			expect(res.body).to.exist
			expect(res.body).to.be.an('array')
			expect(res.body).to.have.lengthOf(2)
			expect(res.body[0].name).to.equal(testProduct.name)
			expect(res.body[0].imageURL).to.equal(testProduct.imageURL)
			expect(res.body[1].name).to.equal('Test Product 2')
			expect(res.body[1].imageURL).to.equal('https://example.com/image2.jpg')
			expect(res.body[0]).to.have.property('createdAt')
			expect(res.body[0]).to.have.property('updatedAt')
			expect(res.body[1]).to.have.property('createdAt')
			expect(res.body[1]).to.have.property('updatedAt')
			expect(res.body[0]).to.have.property('_id')
			expect(res.body[1]).to.have.property('_id')
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

		it('should have status 200', async function () {
			const res = await agent.patch(`/api/v1/products/${testProduct.id}`).send({
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
			}).set('Cookie', sessionCookie)
			expect(res).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const res = await agent.patch(`/api/v1/products/${testProduct.id}`).send({
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
			expect(res).to.have.status(403)
		})

		it('should update a product', async function () {
			const res = await agent.patch(`/api/v1/products/${testProduct.id}`).send({
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
			}).set('Cookie', sessionCookie)
			expect(res.body).to.exist
			expect(res.body.name).to.equal('Updated Product')
			expect(res.body.imageURL).to.equal('https://example.com/imageNew.jpg')
			expect(res.body.price).to.equal(200)
			expect(res.body.orderWindow.from.hour).to.equal(1)
			expect(res.body.orderWindow.from.minute).to.equal(0)
			expect(res.body.orderWindow.to.hour).to.equal(22)
			expect(res.body.orderWindow.to.minute).to.equal(59)
		})

		it('should return the patched product', async function () {
			const res = await agent.patch(`/api/v1/products/${testProduct.id}`).send({
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
			}).set('Cookie', sessionCookie)
			expect(res.body).to.exist
			expect(res.body.name).to.equal('Updated Product')
			expect(res.body.imageURL).to.equal('https://example.com/imageNew.jpg')
			expect(res.body.price).to.equal(200)
			expect(res.body.orderWindow.from.hour).to.equal(1)
			expect(res.body.orderWindow.from.minute).to.equal(0)
			expect(res.body.orderWindow.to.hour).to.equal(22)
			expect(res.body.orderWindow.to.minute).to.equal(59)
			expect(res.body).to.have.property('createdAt')
			expect(res.body).to.have.property('updatedAt')
			expect(res.body).to.have.property('_id')
		})

		it('should populate the options', async function () {
			const testOption = await OptionModel.create({
				name: 'Test Option',
				imageURL: 'https://example.com/image.jpg',
				price: 50
			})

			await ProductModel.findByIdAndUpdate(testProduct.id, { options: [testOption.id] })

			const res = await agent.patch(`/api/v1/products/${testProduct.id}`).send({
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
			}).set('Cookie', sessionCookie)

			expect(res.body).to.exist
			expect(res.body.options).to.be.an('array')
			expect(res.body.options).to.have.lengthOf(1)
			expect(res.body.options[0].name).to.equal('Test Option')
			expect(res.body.options[0].imageURL).to.equal('https://example.com/image.jpg')
		})

		it('should allow a partial update', async function () {
			await agent.patch(`/api/v1/products/${testProduct.id}`).send({
				name: 'Updated Product'
			}).set('Cookie', sessionCookie)

			const product = await ProductModel.findById(testProduct.id)

			expect(product?.name).to.equal('Updated Product')
			expect(product?.imageURL).to.equal('https://example.com/image.jpg')
			expect(product?.price).to.equal(100)
			expect(product?.orderWindow.from.hour).to.equal(0)
			expect(product?.orderWindow.from.minute).to.equal(0)
			expect(product?.orderWindow.to.hour).to.equal(23)
			expect(product?.orderWindow.to.minute).to.equal(59)
		})

		it('should update a product with an option', async function () {
			const testOption = await OptionModel.create({
				name: 'Test Option',
				imageURL: 'https://example.com/image.jpg',
				price: 50
			})

			await agent.patch(`/api/v1/products/${testProduct.id}`).send({
				options: [testOption.id]
			}).set('Cookie', sessionCookie)

			const product = await ProductModel.findById(testProduct.id).populate('options') as any

			expect(product?.name).to.equal('Test Product')
			expect(product?.imageURL).to.equal('https://example.com/image.jpg')
			expect(product?.price).to.equal(100)
			expect(product?.orderWindow.from.hour).to.equal(0)
			expect(product?.orderWindow.from.minute).to.equal(0)
			expect(product?.orderWindow.to.hour).to.equal(23)
			expect(product?.orderWindow.to.minute).to.equal(59)
			expect(product?.options).to.be.an('array')
			expect(product?.options).to.have.lengthOf(1)
			expect(product?.options[0]._id.toString()).to.equal(testOption.id)
		})

		it('should patch a field which is not present', async function () {
			await ProductModel.findByIdAndUpdate(testProduct.id, { $unset: { imageURL: 1 } })
			const updatedFields = {
				imageURL: 'https://example.com/imageNew.jpg'
			}

			await agent.patch(`/api/v1/products/${testProduct.id}`).send(updatedFields).set('Cookie', sessionCookie)

			const product = await ProductModel.findById(testProduct.id)

			expect(product?.name).to.equal('Test Product')
			expect(product?.imageURL).to.equal('https://example.com/imageNew.jpg')
			expect(product?.price).to.equal(100)
			expect(product?.orderWindow.from.hour).to.equal(0)
			expect(product?.orderWindow.from.minute).to.equal(0)
			expect(product?.orderWindow.to.hour).to.equal(23)
			expect(product?.orderWindow.to.minute).to.equal(59)
		})

		it('should return a 404 if the product does not exist', async function () {
			const res = await agent.patch(`/api/v1/products/${new mongoose.Types.ObjectId().toString()}`).send({
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
			}).set('Cookie', sessionCookie)
			expect(res).to.have.status(404)
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

		it('should have status 204', async function () {
			const res = await agent.delete(`/api/v1/products/${testProduct.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(res).to.have.status(204)
			expect(res.body).to.be.empty
		})

		it('should have status 403 if not logged in', async function () {
			const res = await agent.delete(`/api/v1/products/${testProduct.id}`).send({ confirm: true })
			expect(res).to.have.status(403)
		})

		it('should delete a product', async function () {
			const res = await agent.delete(`/api/v1/products/${testProduct.id}`).send({ confirm: true }).set('Cookie', sessionCookie)

			expect(res.body).to.be.empty
			const product = await ProductModel.findById(testProduct.id)
			expect(product).to.not.exist
		})

		it('should return a 400 if the confirm field is set to false', async function () {
			const res = await agent.delete(`/api/v1/products/${testProduct.id}`).send({ confirm: false }).set('Cookie', sessionCookie)
			expect(res).to.have.status(400)
		})

		it('should return a 400 if the confirm field is not set', async function () {
			const res = await agent.delete(`/api/v1/products/${testProduct.id}`).set('Cookie', sessionCookie)
			expect(res).to.have.status(400)
		})

		it('should return a 400 if the confirm field is not a boolean', async function () {
			const res = await agent.delete(`/api/v1/products/${testProduct.id}`).send({ confirm: 'true' }).set('Cookie', sessionCookie)
			expect(res).to.have.status(400)
		})

		it('should return a 404 if the product does not exist', async function () {
			const res = await agent.delete('/api/v1/products/123456789012345678901234').send({ confirm: true }).set('Cookie', sessionCookie)
			expect(res).to.have.status(404)
		})
	})
})
