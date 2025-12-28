/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import mongoose from 'mongoose'
import sinon from 'sinon'

import OptionModel from '../../../app/models/Option.js'
import ProductModel, { IProductFrontend } from '../../../app/models/Product.js'
import { socketEmitters } from '../../../app/utils/socket.js'

describe('Product WebSocket Emitters', function () {
	let emitSocketEventSpy: sinon.SinonSpy

	let option1Id: string, option2Id: string

	beforeEach(async function () {
		if (mongoose.connection.db !== undefined) {
			await mongoose.connection.db.dropDatabase()
		}

		const option1 = await OptionModel.create({ name: 'Option 1', price: 10 })
		const option2 = await OptionModel.create({ name: 'Option 2', price: 20 })
		option1Id = option1._id.toString()
		option2Id = option2._id.toString()

		emitSocketEventSpy = sinon.spy(socketEmitters, 'emitSocketEvent')
	})

	afterEach(function () {
		sinon.restore()
	})

	describe('Create Operations', function () {
		it('should emit "productCreated" via Model.create()', async function () {
			const productData = {
				name: 'New Product',
				price: 100,
				orderWindow: {
					from: { hour: 8, minute: 0 },
					to: { hour: 17, minute: 0 }
				},
				options: [option1Id]
			}
			const product = await ProductModel.create(productData)

			const expectedProductFrontend: Partial<IProductFrontend> = {
				_id: product._id.toString(),
				name: product.name,
				price: product.price,
				options: [option1Id]
			}

			expect(emitSocketEventSpy.calledWith('productCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedProductFrontend)
		})

		it('should emit "productCreated" via new Product().save()', async function () {
			const product = new ProductModel({
				name: 'Product via Save',
				price: 200,
				orderWindow: {
					from: { hour: 9, minute: 30 },
					to: { hour: 18, minute: 30 }
				},
				options: [option1Id, option2Id]
			})
			await product.save()

			const expectedProductFrontend: Partial<IProductFrontend> = {
				_id: product._id.toString(),
				name: product.name,
				price: product.price,
				options: [option1Id, option2Id]
			}

			expect(emitSocketEventSpy.calledWith('productCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedProductFrontend)
		})
	})

	describe('Update Operations', function () {
		it('should emit "productUpdated" via document.save()', async function () {
			const product = await ProductModel.create({
				name: 'Original Product',
				price: 100,
				orderWindow: {
					from: { hour: 8, minute: 0 },
					to: { hour: 17, minute: 0 }
				}
			})

			emitSocketEventSpy.resetHistory()

			product.name = 'Updated Product'
			product.price = 150
			await product.save()

			const expectedProductFrontend: Partial<IProductFrontend> = {
				_id: product._id.toString(),
				name: 'Updated Product',
				price: 150
			}

			expect(emitSocketEventSpy.calledWith('productUpdated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedProductFrontend)
		})

		it('should not emit "productUpdated" via findByIdAndUpdate()', async function () {
			const product = await ProductModel.create({
				name: 'Product to Update',
				price: 100,
				orderWindow: {
					from: { hour: 8, minute: 0 },
					to: { hour: 17, minute: 0 }
				}
			})

			emitSocketEventSpy.resetHistory()

			await ProductModel.findByIdAndUpdate(
				product._id,
				{ name: 'Updated via FindByIdAndUpdate' },
				{ new: true, runValidators: true }
			)

			expect(emitSocketEventSpy.calledWith('productUpdated')).to.be.false
		})
	})

	describe('Delete Operations', function () {
		it('should emit "productDeleted" via Model.deleteOne() (query-based)', async function () {
			const product = await ProductModel.create({
				name: 'Product to Delete Query',
				price: 100,
				orderWindow: {
					from: { hour: 8, minute: 0 },
					to: { hour: 17, minute: 0 }
				}
			})
			const productId = product._id.toString()

			emitSocketEventSpy.resetHistory()

			await ProductModel.deleteOne({ _id: product._id })

			expect(emitSocketEventSpy.calledWith('productDeleted')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.equal(productId)
		})

		it('should emit "productDeleted" via document.deleteOne() (document-based)', async function () {
			const product = await ProductModel.create({
				name: 'Product to Delete Document',
				price: 100,
				orderWindow: {
					from: { hour: 8, minute: 0 },
					to: { hour: 17, minute: 0 }
				}
			})
			const productId = product._id.toString()

			emitSocketEventSpy.resetHistory()

			await product.deleteOne()

			expect(emitSocketEventSpy.calledWith('productDeleted')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.equal(productId)
		})
	})
})
