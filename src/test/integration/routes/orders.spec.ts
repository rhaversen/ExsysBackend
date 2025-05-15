/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose from 'mongoose'
import sinon from 'sinon'

import ActivityModel, { type IActivity } from '../../../app/models/Activity.js'
import AdminModel from '../../../app/models/Admin.js'
import KioskModel, { type IKiosk } from '../../../app/models/Kiosk.js'
import OptionModel, { type IOption } from '../../../app/models/Option.js'
import OrderModel, { type IOrder } from '../../../app/models/Order.js'
import ProductModel, { type IProduct } from '../../../app/models/Product.js'
import ReaderModel, { type IReader } from '../../../app/models/Reader.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'
import { getChaiAgent as agent, extractConnectSid } from '../../testSetup.js'

describe('Orders routes', function () {
	let adminSessionCookie: string
	let kioskSessionCookie: string
	let adminFields: { name: string; password: string }
	let kioskFields: { name: string; password: string; kioskTag: string }

	beforeEach(async function () {
		// Log the admin agent in to get a valid session
		adminFields = {
			name: 'Agent Admin',
			password: 'agentPassword'
		}
		await AdminModel.create(adminFields)

		const adminResponse = await agent().post('/api/v1/auth/login-admin-local').send(adminFields)
		adminSessionCookie = extractConnectSid(adminResponse.headers['set-cookie'])

		// Create and log in kiosk user
		kioskFields = {
			name: 'Test Kiosk',
			kioskTag: '12345',
			password: 'Password'
		}
		const testReader = await ReaderModel.create({
			apiReferenceId: 'test-main',
			readerTag: '12346'
		})
		await KioskModel.create({ ...kioskFields, readerId: testReader.id })

		const kioskResponse = await agent().post('/api/v1/auth/login-kiosk-local').send(kioskFields)
		kioskSessionCookie = extractConnectSid(kioskResponse.headers['set-cookie'])
	})

	describe('POST /v1/orders', function () {
		let testProduct1: IProduct
		let testRoom: IRoom
		let testActivity: IActivity
		let testOption1: IOption
		let testReader: IReader
		let testKiosk: IKiosk

		beforeEach(async function () {
			testProduct1 = await ProductModel.create({
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

			testRoom = await RoomModel.create({
				name: 'Test Room',
				description: 'A test room'
			})

			testActivity = await ActivityModel.create({
				roomId: testRoom.id,
				name: 'Test Activity'
			})

			testOption1 = await OptionModel.create({
				name: 'Test Option',
				price: 50
			})

			testReader = await ReaderModel.create({
				apiReferenceId: 'test',
				readerTag: '12345'
			})

			testKiosk = await KioskModel.create({
				readerId: testReader.id,
				name: 'Test Kiosk',
				password: 'password'
			})
		})

		it('should have status 201', async function () {
			const response = await agent().post('/api/v1/orders').send({
				kioskId: testKiosk.id,
				activityId: testActivity.id,
				roomId: testRoom.id,
				products: [{
					id: testProduct1.id,
					quantity: 1
				}],
				options: [{
					id: testOption1.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			}).set('Cookie', kioskSessionCookie)

			expect(response).to.have.status(201)
		})

		it('should have status 403 if not logged in', async function () {
			const response = await agent().post('/api/v1/orders').send({
				kioskId: testKiosk.id,
				activityId: testActivity.id,
				roomId: testRoom.id,
				products: [{
					id: testProduct1.id,
					quantity: 1
				}],
				options: [{
					id: testOption1.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			})

			expect(response).to.have.status(403)
		})

		it('should create a valid order', async function () {
			await agent().post('/api/v1/orders').send({
				kioskId: testKiosk.id,
				activityId: testActivity.id,
				roomId: testRoom.id,
				products: [{
					id: testProduct1.id,
					quantity: 1
				}],
				options: [{
					id: testOption1.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			}).set('Cookie', kioskSessionCookie)

			const order = await OrderModel.findOne({})
			expect(order).to.exist
			expect(order?.roomId.toString()).to.equal(testRoom.id)
			expect(order?.activityId.toString()).to.equal(testActivity.id)
			expect(order?.products[0].id.toString()).to.equal(testProduct1.id)
			expect(order?.products[0].quantity).to.equal(1)
			expect(order?.options?.[0].id.toString()).to.equal(testOption1.id)
			expect(order?.options?.[0].quantity).to.equal(1)
			expect(order).to.have.property('createdAt')
			expect(order).to.have.property('updatedAt')
		})

		it('should return the order', async function () {
			const res = await agent().post('/api/v1/orders').send({
				kioskId: testKiosk.id,
				activityId: testActivity.id,
				roomId: testRoom.id,
				products: [{
					id: testProduct1.id,
					quantity: 1
				}],
				options: [{
					id: testOption1.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			}).set('Cookie', kioskSessionCookie)
			expect(res.body).to.exist
			expect(res.body.roomId).to.equal(testRoom.id)
			expect(res.body.activityId).to.equal(testActivity.id)
			expect(res.body.products[0]._id).to.equal(testProduct1.id)
			expect(res.body.products[0].quantity).to.equal(1)
			expect(res.body.options?.[0]._id).to.equal(testOption1.id)
			expect(res.body.options?.[0].quantity).to.equal(1)
			expect(res.body).to.have.property('createdAt')
			expect(res.body).to.have.property('updatedAt')
			expect(res.body).to.have.property('_id')
		})

		it('should handle orders with undefined options', async function () {
			await agent().post('/api/v1/orders').send({
				activityId: testActivity.id,
				kioskId: testKiosk.id,
				roomId: testRoom.id,
				products: [{
					id: testProduct1.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			}).set('Cookie', kioskSessionCookie)
			const order = await OrderModel.findOne({})
			expect(order).to.exist
		})

		it('should handle orders with undefined products', async function () {
			await agent().post('/api/v1/orders').send({
				activityId: testActivity.id,
				roomId: testRoom.id,
				kioskId: testKiosk.id,
				options: [{
					id: testOption1.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			}).set('Cookie', kioskSessionCookie)
			const order = await OrderModel.findOne({})
			expect(order).to.not.exist
		})

		it('should not allow setting the _id', async function () {
			const updatedId = new mongoose.Types.ObjectId().toString()

			await agent().post('/api/v1/orders').send({
				activityId: testActivity.id,
				roomId: testRoom.id,
				kioskId: testKiosk.id,
				options: [{
					id: testOption1.id,
					quantity: 1
				}],
				checkoutMethod: 'later',
				_id: updatedId
			}).set('Cookie', kioskSessionCookie)
			const order = await OrderModel.findOne({})
			expect(order?.id.toString()).to.not.equal(updatedId)
		})

		it('should require a roomId', async function () {
			const res = await agent().post('/api/v1/orders').send({
				kioskId: testKiosk.id,
				activityId: testActivity.id,
				products: [{
					id: testProduct1.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			}).set('Cookie', kioskSessionCookie)
			expect(res).to.have.status(400)
			expect(res.body.error).to.exist
		})

		it('should not allow a non-existent roomId', async function () {
			const res = await agent().post('/api/v1/orders').send({
				kioskId: testKiosk.id,
				activityId: testActivity.id,
				roomId: new mongoose.Types.ObjectId().toString(),
				products: [{
					id: testProduct1.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			}).set('Cookie', kioskSessionCookie)
			expect(res).to.have.status(400)
			expect(res.body.error).to.exist
		})

		describe('Quantity validation', function () {
			describe('Product', function () {
				let testProduct2: IProduct

				beforeEach(async function () {
					testProduct2 = await ProductModel.create({
						name: 'Test Product1',
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

				it('should create a order with a product with quantity 0 and product with quantity 1', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 0
						},
						{
							id: testProduct2.id,
							quantity: 1
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order).to.exist
				})

				it('should remove products with quantity 0', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 0
						},
						{
							id: testProduct2.id,
							quantity: 1
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.products.length).to.equal(1)
				})

				it('should combine products with the same product id', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						},
						{
							id: testProduct1.id,
							quantity: 1
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.products[0].quantity).to.equal(2)
				})

				it('should handle two duplicate and a unique products', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 2
						},
						{
							id: testProduct1.id,
							quantity: 1
						},
						{
							id: testProduct2.id,
							quantity: 1
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.products.length).to.equal(2)
					expect(order?.products[0].quantity).to.equal(3)
					expect(order?.products[1].quantity).to.equal(1)
				})

				it('should handle unique products with different quantities', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						},
						{
							id: testProduct2.id,
							quantity: 2
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.products.length).to.equal(2)
					expect(order?.products[0].quantity).to.equal(1)
					expect(order?.products[1].quantity).to.equal(2)
				})

				it('should handle products with quantity 0 and products with quantity 1', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						},
						{
							id: testProduct2.id,
							quantity: 0
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.products.length).to.equal(1)
					expect(order?.products[0].quantity).to.equal(1)
				})

				it('should handle products with quantity 1 and products with undefined quantity', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						},
						{
							id: testProduct2.id
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order).to.not.exist
				})
			})

			describe('Option', function () {
				let testOption2: IOption

				beforeEach(async function () {
					testOption2 = await OptionModel.create({
						name: 'Test Option1',
						price: 50
					})
				})

				it('should create a order with a option with quantity 0 and option with quantity 1', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						}],
						options: [{
							id: testOption1.id,
							quantity: 0
						},
						{
							id: testOption2.id,
							quantity: 1
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order).to.exist
				})

				it('should create a order with a option with quantity 0', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						}],
						options: [{
							id: testOption1.id,
							quantity: 0
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order).to.exist
				})

				it('should remove option with quantity 0', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						}],
						options: [{
							id: testOption1.id,
							quantity: 0
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.options?.length).to.equal(0)
				})

				it('should remove options with quantity 0', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						}],
						options: [{
							id: testOption1.id,
							quantity: 0
						},
						{
							id: testOption2.id,
							quantity: 1
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.options?.length).to.equal(1)
				})

				it('should combine options with the same option id', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						}],
						options: [{
							id: testOption1.id,
							quantity: 1
						},
						{
							id: testOption1.id,
							quantity: 1
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.options?.[0].quantity).to.equal(2)
				})

				it('should handle two duplicate options with different quantities', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						}],
						options: [{
							id: testOption1.id,
							quantity: 2
						},
						{
							id: testOption1.id,
							quantity: 1
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.options?.[0].quantity).to.equal(3)
				})

				it('should handle two duplicate and a unique option', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						}],
						options: [{
							id: testOption1.id,
							quantity: 2
						},
						{
							id: testOption1.id,
							quantity: 1
						},
						{
							id: testOption2.id,
							quantity: 1
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.options?.length).to.equal(2)
					expect(order?.options?.[0].quantity).to.equal(3)
					expect(order?.options?.[1].quantity).to.equal(1)
				})

				it('should handle unique options with different quantities', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						}],
						options: [{
							id: testOption1.id,
							quantity: 1
						},
						{
							id: testOption2.id,
							quantity: 2
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.options?.length).to.equal(2)
					expect(order?.options?.[0].quantity).to.equal(1)
					expect(order?.options?.[1].quantity).to.equal(2)
				})

				it('should handle options with quantity 0 and options with quantity 1', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						}],
						options: [{
							id: testOption1.id,
							quantity: 1
						},
						{
							id: testOption2.id,
							quantity: 0
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order?.options?.length).to.equal(1)
					expect(order?.options?.[0].quantity).to.equal(1)
				})

				it('should handle options with quantity 1 and options with undefined quantity', async function () {
					await agent().post('/api/v1/orders').send({
						kioskId: testKiosk.id,
						activityId: testActivity.id,
						roomId: testRoom.id,
						products: [{
							id: testProduct1.id,
							quantity: 1
						}],
						options: [{
							id: testOption1.id,
							quantity: 1
						},
						{
							id: testOption2.id
						}],
						checkoutMethod: 'later'
					}).set('Cookie', kioskSessionCookie)
					const order = await OrderModel.findOne({})
					expect(order).to.not.exist
				})
			})
		})

		describe('Use sumUp checkout method', function () {
			it('should create a payment on the order', async function () {
				await agent().post('/api/v1/orders').send({
					skipCheckout: false,
					kioskId: testKiosk.id,
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 1
					}],
					checkoutMethod: 'sumUp'
				}).set('Cookie', kioskSessionCookie)
				const order = await OrderModel.findOne({})
				expect(order?.payment).to.exist
			})

			it('should set the payment status to pending', async function () {
				await agent().post('/api/v1/orders').send({
					skipCheckout: false,
					kioskId: testKiosk.id,
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 1
					}],
					checkoutMethod: 'sumUp'
				}).set('Cookie', kioskSessionCookie)
				const order = await OrderModel.findOne({})
				expect(order?.payment.paymentStatus).to.equal('pending')
			})

			it('should set the clientTransactionId on the payment', async function () {
				await agent().post('/api/v1/orders').send({
					skipCheckout: false,
					kioskId: testKiosk.id,
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 1
					}],
					checkoutMethod: 'sumUp'
				}).set('Cookie', kioskSessionCookie)
				const order = await OrderModel.findOne({})
				expect(order?.payment.clientTransactionId).to.exist
			})
		})

		describe('Use later checkout method', function () {
			it('should create a payment on the order', async function () {
				await agent().post('/api/v1/orders').send({
					skipCheckout: true,
					kioskId: testKiosk.id,
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 1
					}],
					checkoutMethod: 'later'
				}).set('Cookie', kioskSessionCookie)
				const order = await OrderModel.findOne({})
				expect(order?.payment).to.exist
			})

			it('should set the payment status to successful', async function () {
				await agent().post('/api/v1/orders').send({
					skipCheckout: true,
					kioskId: testKiosk.id,
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 1
					}],
					checkoutMethod: 'later'
				}).set('Cookie', kioskSessionCookie)
				const order = await OrderModel.findOne({})
				expect(order?.payment.paymentStatus).to.equal('successful')
			})

			it('should not set the clientTransactionId on the payment', async function () {
				await agent().post('/api/v1/orders').send({
					skipCheckout: true,
					kioskId: testKiosk.id,
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 1
					}],
					checkoutMethod: 'later'
				}).set('Cookie', kioskSessionCookie)
				const order = await OrderModel.findOne({})
				expect(order?.payment.clientTransactionId).to.not.exist
			})
		})

		describe('Use manual checkout method', function () {
			it('should allow admin to create manual order (status 201)', async function () {
				const response = await agent().post('/api/v1/orders').send({
					// No kioskId for manual
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					checkoutMethod: 'manual'
				}).set('Cookie', adminSessionCookie)

				expect(response).to.have.status(201)
			})

			it('should create a payment with status successful for manual order', async function () {
				await agent().post('/api/v1/orders').send({
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{ id: testProduct1.id, quantity: 1 }],
					checkoutMethod: 'manual'
				}).set('Cookie', adminSessionCookie)

				const order = await OrderModel.findOne({})
				expect(order?.payment).to.exist
				expect(order?.payment.paymentStatus).to.equal('successful')
			})

			it('should set kioskId to null for manual order', async function () {
				await agent().post('/api/v1/orders').send({
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{ id: testProduct1.id, quantity: 1 }],
					checkoutMethod: 'manual'
				}).set('Cookie', adminSessionCookie)

				const order = await OrderModel.findOne({})
				expect(order?.kioskId).to.be.null
			})

			it('should return kioskId as null for manual order', async function () {
				const res = await agent().post('/api/v1/orders').send({
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{ id: testProduct1.id, quantity: 1 }],
					checkoutMethod: 'manual'
				}).set('Cookie', adminSessionCookie)

				expect(res.body.kioskId).to.be.null
			})

			it('should forbid admin from using later checkout (status 403)', async function () {
				const res = await agent().post('/api/v1/auth/login-admin-local').send(adminFields)
				const newAdminSessionCookie = extractConnectSid(res.headers['set-cookie'])
				const response = await agent().post('/api/v1/orders').send({
					kioskId: testKiosk.id, // Required for 'later'
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{ id: testProduct1.id, quantity: 1 }],
					checkoutMethod: 'later'
				}).set('Cookie', newAdminSessionCookie)

				expect(response).to.have.status(403)
				expect(response.body.error).to.contain('Forbidden: Admins can only create orders with checkoutMethod \'manual\'')
			})

			it('should forbid admin from using sumUp checkout (status 403)', async function () {
				const res = await agent().post('/api/v1/auth/login-admin-local').send(adminFields)
				const newAdminSessionCookie = extractConnectSid(res.headers['set-cookie'])
				const response = await agent().post('/api/v1/orders').send({
					kioskId: testKiosk.id, // Required for 'sumUp'
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{ id: testProduct1.id, quantity: 1 }],
					checkoutMethod: 'sumUp'
				}).set('Cookie', newAdminSessionCookie)

				expect(response).to.have.status(403)
				expect(response.body.error).to.contain('Forbidden: Admins can only create orders with checkoutMethod \'manual\'')
			})

			it('should forbid kiosk from using manual checkout (status 403)', async function () {
				const response = await agent().post('/api/v1/orders').send({
					// No kioskId for manual
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{ id: testProduct1.id, quantity: 1 }],
					checkoutMethod: 'manual'
				}).set('Cookie', kioskSessionCookie) // Use kiosk session

				expect(response).to.have.status(403)
				expect(response.body.error).to.contain('Forbidden: Kiosks can only create orders with checkoutMethod \'sumUp\' or \'later\'')
			})

			it('should reject manual order if kioskId is provided (status 400)', async function () {
				const response = await agent().post('/api/v1/orders').send({
					kioskId: testKiosk.id, // Incorrectly providing kioskId
					activityId: testActivity.id,
					roomId: testRoom.id,
					products: [{ id: testProduct1.id, quantity: 1 }],
					checkoutMethod: 'manual'
				}).set('Cookie', adminSessionCookie)

				expect(response).to.have.status(400)
				expect(response.body.error).to.equal('kioskId must not be provided for manual orders')
			})
		})
	})

	describe('GET /v1/orders', function () {
		let testProduct1: IProduct
		let testProduct2: IProduct
		let testProduct3: IProduct
		let testProduct4: IProduct

		let testRoom: IRoom
		let testActivity: IActivity
		let testOption: IOption
		let testReader: IReader
		let testKiosk: IKiosk

		let clock: sinon.SinonFakeTimers

		let date05: Date
		let date1: Date
		let date15: Date
		let date2: Date
		let date25: Date
		let date3: Date
		let date35: Date
		let date4: Date

		beforeEach(async function () {
			date05 = new Date('2024-04-23T13:00:00Z')
			date1 = new Date('2024-04-24T11:00:00Z') // Product 1, Product 2
			date15 = new Date('2024-04-24T13:00:00Z')
			date2 = new Date('2024-04-25T11:00:00Z') // Product 3
			date25 = new Date('2024-04-25T13:00:00Z')
			date3 = new Date('2024-04-26T11:00:00Z') // Product 4
			date35 = new Date('2024-04-26T13:00:00Z')
			date4 = new Date('2024-04-27T11:00:00Z')

			clock = sinon.useFakeTimers(date1)

			testProduct1 = await ProductModel.create({
				name: 'Test Product 1',
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

			testProduct2 = await ProductModel.create({
				name: 'Test Product 2',
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

			testProduct3 = await ProductModel.create({
				name: 'Test Product 3',
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

			testProduct4 = await ProductModel.create({
				name: 'Test Product 4',
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

			testRoom = await RoomModel.create({
				name: 'Test Room',
				description: 'A test room'
			})

			testActivity = await ActivityModel.create({
				roomId: testRoom.id,
				name: 'Test Activity'
			})

			testOption = await OptionModel.create({
				name: 'Test Option',
				price: 50
			})

			testReader = await ReaderModel.create({
				apiReferenceId: 'test',
				readerTag: '12345'
			})

			testKiosk = await KioskModel.create({
				readerId: testReader.id,
				name: 'Test Kiosk',
				password: 'password'
			})

			await OrderModel.create({
				activityId: testActivity.id,
				roomId: testRoom.id,
				payment: { paymentStatus: 'successful' },
				kioskId: testKiosk.id,
				products: [{
					id: testProduct1.id,
					quantity: 1
				}],
				options: [{
					id: testOption.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			})

			await OrderModel.create({
				payment: { paymentStatus: 'failed' },
				activityId: testActivity.id,
				roomId: testRoom.id,
				kioskId: testKiosk.id,
				products: [{
					id: testProduct2.id,
					quantity: 1
				}],
				options: [{
					id: testOption.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			})
		})

		it('should have status 200', async function () {
			const res = await agent().get('/api/v1/orders').set('Cookie', adminSessionCookie)
			expect(res).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const res = await agent().get('/api/v1/orders')
			expect(res).to.have.status(403)
		})

		it('should return all orders', async function () {
			const res = await agent().get('/api/v1/orders').set('Cookie', adminSessionCookie)
			expect(res.body).to.exist
			expect(res.body[0].activityId.toString()).to.equal(testActivity.id)
			expect(res.body[0].products[0]._id.toString()).to.equal(testProduct1.id)
			expect(res.body[0].products[0].quantity).to.equal(1)
			expect(res.body[0].options[0]._id.toString()).to.equal(testOption.id)
			expect(res.body[0].options[0].quantity).to.equal(1)
			expect(res.body[0].roomId.toString()).to.equal(testRoom.id)
			expect(res.body[0].kioskId.toString()).to.equal(testKiosk.id)
			expect(res.body[1].activityId.toString()).to.equal(testActivity.id)
			expect(res.body[1].products[0]._id.toString()).to.equal(testProduct2.id)
			expect(res.body[1].products[0].quantity).to.equal(1)
			expect(res.body[1].options[0]._id.toString()).to.equal(testOption.id)
			expect(res.body[1].options[0].quantity).to.equal(1)
			expect(res.body[1].roomId.toString()).to.equal(testRoom.id)
			expect(res.body[1].kioskId.toString()).to.equal(testKiosk.id)
			expect(res.body.length).to.equal(2)
			expect(res.body.map((order: any) => order.createdAt)).to.have.lengthOf(2)
			expect(res.body.map((order: any) => order.updatedAt)).to.have.lengthOf(2)
			expect(res.body.map((order: any) => order._id)).to.have.lengthOf(2)
		})

		it('should return an empty array if there are no orders', async function () {
			await OrderModel.deleteMany({})
			const res = await agent().get('/api/v1/orders').set('Cookie', adminSessionCookie)
			expect(res.body).to.exist
			expect(res.body.length).to.equal(0)
		})

		describe('GET /v1/orders/?status', function () {
			beforeEach(async function () {
				await OrderModel.findOneAndUpdate({
					products: { $elemMatch: { id: testProduct1.id } },
					options: { $elemMatch: { id: testOption.id } }
				}, { status: 'delivered' })
				await OrderModel.findOneAndUpdate({
					products: { $elemMatch: { id: testProduct2.id } },
					options: { $elemMatch: { id: testOption.id } }
				}, { status: 'delivered' })
				await OrderModel.create({
					payment: { paymentStatus: 'successful' },
					activityId: testActivity.id,
					roomId: testRoom.id,
					kioskId: testKiosk.id,
					products: [{
						id: testProduct3.id,
						quantity: 1
					}],
					options: [{
						id: testOption.id,
						quantity: 1
					}],
					status: 'pending',
					checkoutMethod: 'later'
				})
				await OrderModel.create({
					payment: { paymentStatus: 'failed' },
					activityId: testActivity.id,
					roomId: testRoom.id,
					kioskId: testKiosk.id,
					products: [{
						id: testProduct4.id,
						quantity: 1
					}],
					options: [{
						id: testOption.id,
						quantity: 1
					}],
					status: 'confirmed',
					checkoutMethod: 'later'
				})
			})

			it('should return all orders with status delivered', async function () {
				const res = await agent().get('/api/v1/orders/?status=delivered').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(2)
				expect(res.body[0].products[0]._id).to.equal(testProduct1.id)
				expect(res.body[1].products[0]._id).to.equal(testProduct2.id)
			})

			it('should return an empty array if there are no orders with status', async function () {
				await OrderModel.deleteMany({ status: 'delivered' })
				const res = await agent().get('/api/v1/orders/?status=delivered').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(0)
			})

			it('should include the paymentStatus in the response', async function () {
				const res = await agent().get('/api/v1/orders/?status=delivered').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body[0].paymentStatus).to.equal('successful')
				expect(res.body[1].paymentStatus).to.equal('failed')
			})

			it('should allow multiple statuses', async function () {
				const res = await agent().get('/api/v1/orders/?status=delivered,pending').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(3)
				expect(res.body[0].products[0]._id).to.equal(testProduct1.id)
				expect(res.body[1].products[0]._id).to.equal(testProduct2.id)
				expect(res.body[2].products[0]._id).to.equal(testProduct3.id)
			})
		})

		describe('GET /v1/orders/?fromDate&toDate', function () {
			beforeEach(async function () {
				clock.tick(24 * 60 * 60 * 1000) // Advance time by 24 hours
				await OrderModel.create({
					payment: { paymentStatus: 'successful' },
					activityId: testActivity.id,
					roomId: testRoom.id,
					kioskId: testKiosk.id,
					products: [{
						id: testProduct3.id,
						quantity: 1
					}],
					options: [{
						id: testOption.id,
						quantity: 1
					}],
					checkoutMethod: 'later'
				})
				clock.tick(24 * 60 * 60 * 1000) // Advance time by another 24 hours
				await OrderModel.create({
					payment: { paymentStatus: 'failed' },
					activityId: testActivity.id,
					roomId: testRoom.id,
					kioskId: testKiosk.id,
					products: [{
						id: testProduct4.id,
						quantity: 1
					}],
					options: [{
						id: testOption.id,
						quantity: 1
					}],
					checkoutMethod: 'later'
				})
			})

			it('should have status 200', async function () {
				const res = await agent().get('/api/v1/orders/?fromDate=2024-04-24T00:00:00.000Z&toDate=2024-04-24T23:59:59.999Z').set('Cookie', adminSessionCookie)
				expect(res).to.have.status(200)
			})

			it('should have status 403 if not logged in', async function () {
				const res = await agent().get('/api/v1/orders/?fromDate=2024-04-24T00:00:00.000Z&toDate=2024-04-24T23:59:59.999Z')
				expect(res).to.have.status(403)
			})

			it('should include timestamp and id in the response', async function () {
				const res = await agent().get('/api/v1/orders/?fromDate=2024-04-24T00:00:00.000Z&toDate=2024-04-24T23:59:59.999Z').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.map((order: any) => order.createdAt)).to.have.lengthOf(2)
				expect(res.body.map((order: any) => order.updatedAt)).to.have.lengthOf(2)
				expect(res.body.map((order: any) => order._id)).to.have.lengthOf(2)
			})

			it('should include the paymentStatus in the response', async function () {
				const res = await agent().get('/api/v1/orders/?fromDate=2024-04-24T00:00:00.000Z&toDate=2024-04-24T23:59:59.999Z').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body[0].paymentStatus).to.equal('successful')
				expect(res.body[1].paymentStatus).to.equal('failed')
			})

			it('should return an empty array if there are no orders in the interval', async function () {
				const res = await agent().get(`/api/v1/orders/?fromDate=${date35.toISOString()}&toDate=${date4.toISOString()}`).set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(0)
			})

			it('should return an order', async function () {
				const res = await agent().get(`/api/v1/orders/?fromDate=${date15.toISOString()}&toDate=${date25.toISOString()}`).set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(1)
				expect(res.body[0].products[0]._id).to.equal(testProduct3.id)
			})

			it('should return two orders', async function () {
				const res = await agent().get(`/api/v1/orders/?fromDate=${date05.toISOString()}&toDate=${date15.toISOString()}`).set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(2)
				const productIds = res.body.map((order: any) => order.products[0]._id)
				expect(productIds).to.have.members([testProduct1.id, testProduct2.id])
			})

			it('should return orders over longer intervals', async function () {
				const res = await agent().get(`/api/v1/orders/?fromDate=${date05.toISOString()}&toDate=${date3.toISOString()}`).set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(4)
				const productIds = res.body.map((order: any) => order.products[0]._id)
				expect(productIds).to.have.members([testProduct1.id, testProduct2.id, testProduct3.id, testProduct4.id])
			})

			it('should return the order inclusive of the date with same from and to date', async function () {
				const res = await agent().get(`/api/v1/orders/?fromDate=${date2.toISOString()}&toDate=${date2.toISOString()}`).set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(1)
				expect(res.body[0].products[0]._id).to.equal(testProduct3.id)
			})

			it('should return multiple orders inclusive of the date with same from and to date', async function () {
				const res = await agent().get(`/api/v1/orders/?fromDate=${date1.toISOString()}&toDate=${date1.toISOString()}`).set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(2)
				const productIds = res.body.map((order: any) => order.products[0]._id)
				expect(productIds).to.have.members([testProduct1.id, testProduct2.id])
			})

			it('should return orders inclusive of the to date', async function () {
				const res = await agent().get(`/api/v1/orders/?fromDate=${date25.toISOString()}&toDate=${date3.toISOString()}`).set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(1)
				expect(res.body[0].products[0]._id).to.equal(testProduct4.id)
			})

			it('should return all orders if no dates are provided', async function () {
				const res = await agent().get('/api/v1/orders').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(4)
				const productIds = res.body.map((order: any) => order.products[0]._id)
				expect(productIds).to.have.members([testProduct1.id, testProduct2.id, testProduct3.id, testProduct4.id])
			})

			it('should return all following orders if only fromDate is provided', async function () {
				const res = await agent().get(`/api/v1/orders/?fromDate=${date15.toISOString()}`).set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(2)
				const productIds = res.body.map((order: any) => order.products[0]._id)
				expect(productIds).to.have.members([testProduct3.id, testProduct4.id])
			})

			it('should return all previous orders if only toDate is provided', async function () {
				const res = await agent().get(`/api/v1/orders/?toDate=${date25.toISOString()}`).set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(3)
				const productIds = res.body.map((order: any) => order.products[0]._id)
				expect(productIds).to.have.members([testProduct1.id, testProduct2.id, testProduct3.id])
			})

			it('should not return orders if fromDate is after toDate', async function () {
				const res = await agent().get(`/api/v1/orders/?fromDate=${date3.toISOString()}&toDate=${date1.toISOString()}`).set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(0)
			})
		})

		describe('GET /v1/orders/?paymentStatus', function () {
			it('should return all orders with paymentStatus successful', async function () {
				const res = await agent().get('/api/v1/orders/?paymentStatus=successful').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(1)
				expect(res.body[0].products[0]._id).to.equal(testProduct1.id)
			})

			it('should return an empty array if there are no orders with paymentStatus', async function () {
				await OrderModel.findOneAndUpdate({
					products: { $elemMatch: { id: testProduct1.id } },
					options: { $elemMatch: { id: testOption.id } }
				}, { payment: { paymentStatus: 'pending' } })
				const res = await agent().get('/api/v1/orders/?paymentStatus=successful').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(0)
			})

			it('should allow multiple paymentStatuses', async function () {
				const res = await agent().get('/api/v1/orders/?paymentStatus=successful,failed').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(2)
				expect(res.body[0].products[0]._id).to.equal(testProduct1.id)
				expect(res.body[1].products[0]._id).to.equal(testProduct2.id)
			})
		})

		describe('GET /v1/orders/?fromDate&toDate&status&paymentStatus', function () {
			beforeEach(async function () {
				await OrderModel.findOneAndUpdate({
					products: { $elemMatch: { id: testProduct1.id } },
					options: { $elemMatch: { id: testOption.id } }
				}, { status: 'delivered' })
				await OrderModel.findOneAndUpdate({
					products: { $elemMatch: { id: testProduct2.id } },
					options: { $elemMatch: { id: testOption.id } }
				}, { status: 'delivered' })
				await OrderModel.create({
					payment: { paymentStatus: 'successful' },
					activityId: testActivity.id,
					roomId: testRoom.id,
					kioskId: testKiosk.id,
					products: [{
						id: testProduct3.id,
						quantity: 1
					}],
					options: [{
						id: testOption.id,
						quantity: 1
					}],
					status: 'pending',
					checkoutMethod: 'later'
				})
				await OrderModel.create({
					payment: { paymentStatus: 'failed' },
					activityId: testActivity.id,
					roomId: testRoom.id,
					kioskId: testKiosk.id,
					products: [{
						id: testProduct4.id,
						quantity: 1
					}],
					options: [{
						id: testOption.id,
						quantity: 1
					}],
					status: 'confirmed',
					checkoutMethod: 'later'
				})
			})

			it('should return all orders with status delivered and paymentStatus successful', async function () {
				const res = await agent().get('/api/v1/orders/?status=delivered&paymentStatus=successful&fromDate=2024-04-24T00:00:00.000Z&toDate=2024-04-24T23:59:59.999Z').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(1)
				expect(res.body[0].products[0]._id).to.equal(testProduct1.id)
			})

			it('should return an empty array if there are no orders with status and paymentStatus', async function () {
				const res = await agent().get('/api/v1/orders/?status=delivered&paymentStatus=successful&fromDate=2024-04-25T00:00:00.000Z&toDate=2024-04-25T23:59:59.999Z').set('Cookie', adminSessionCookie)
				expect(res.body).to.exist
				expect(res.body.length).to.equal(0)
			})
		})
	})

	describe('PATCH /v1/orders', function () {
		let testProduct1: IProduct
		let testRoom: IRoom
		let testActivity: IActivity
		let testOption1: IOption
		let testReader: IReader
		let testKiosk: IKiosk

		let order1: IOrder
		let order2: IOrder

		beforeEach(async function () {
			testProduct1 = await ProductModel.create({
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

			testRoom = await RoomModel.create({
				name: 'Test Room',
				description: 'A test room'
			})

			testActivity = await ActivityModel.create({
				roomId: testRoom.id,
				name: 'Test Activity'
			})

			testOption1 = await OptionModel.create({
				name: 'Test Option',
				price: 50
			})

			testReader = await ReaderModel.create({
				apiReferenceId: 'test',
				readerTag: '12345'
			})

			testKiosk = await KioskModel.create({
				readerId: testReader.id,
				name: 'Test Kiosk',
				password: 'password'
			})

			order1 = await OrderModel.create({
				payment: { paymentStatus: 'pending' }, // Default to pending for new orders unless specified
				activityId: testActivity.id,
				roomId: testRoom.id,
				kioskId: testKiosk.id,
				products: [{
					id: testProduct1.id,
					quantity: 1
				}],
				options: [{
					id: testOption1.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			})

			order2 = await OrderModel.create({
				payment: { paymentStatus: 'pending' }, // Default to pending for new orders unless specified
				activityId: testActivity.id,
				roomId: testRoom.id,
				kioskId: testKiosk.id,
				products: [{
					id: testProduct1.id,
					quantity: 1
				}],
				options: [{
					id: testOption1.id,
					quantity: 1
				}],
				checkoutMethod: 'later'
			})
		})

		it('should have status 200', async function () {
			this.timeout(10000) // This test fails without an extended timeout for some reason, it doesn't actually take 10 seconds
			const res = await agent().patch('/api/v1/orders').send({
				orderIds: [order1.id],
				status: 'delivered'
			}).set('Cookie', adminSessionCookie)
			expect(res).to.have.status(200)
		})

		it('should have status 403 if not logged in', async function () {
			const res = await agent().patch('/api/v1/orders').send({
				orderIds: [order1.id],
				status: 'delivered'
			})
			expect(res).to.have.status(403)
		})

		it('should update the status of an order', async function () {
			await agent().patch('/api/v1/orders').send({
				orderIds: [order1.id],
				status: 'delivered'
			}).set('Cookie', adminSessionCookie)
			const updatedOrder = await OrderModel.findById(order1.id)
			expect(updatedOrder).to.exist
			expect(updatedOrder?.status).to.equal('delivered')
		})

		it('should update the status of an order to confirmed even if products are out of order window', async function () {
			await ProductModel.findByIdAndUpdate(testProduct1.id, {
				orderWindow: {
					from: {
						hour: 23,
						minute: 59
					},
					to: {
						hour: 0,
						minute: 0
					}
				}
			})

			await agent().patch('/api/v1/orders').send({
				orderIds: [order1.id],
				status: 'confirmed'
			}).set('Cookie', adminSessionCookie)

			const updatedOrder = await OrderModel.findById(order1.id)

			expect(updatedOrder).to.exist
			expect(updatedOrder?.status).to.equal('confirmed')
		})

		it('should update the status of an order to delivered even if products are out of order window', async function () {
			await ProductModel.findByIdAndUpdate(testProduct1.id, {
				orderWindow: {
					from: {
						hour: 23,
						minute: 59
					},
					to: {
						hour: 0,
						minute: 0
					}
				}
			})

			await agent().patch('/api/v1/orders').send({
				orderIds: [order1.id],
				status: 'delivered'
			}).set('Cookie', adminSessionCookie)

			const updatedOrder = await OrderModel.findById(order1.id)

			expect(updatedOrder).to.exist
			expect(updatedOrder?.status).to.equal('delivered')
		})

		it('should return the updated order', async function () {
			const res = await agent().patch('/api/v1/orders').send({
				orderIds: [order1.id],
				status: 'delivered'
			}).set('Cookie', adminSessionCookie)
			expect(res.body).to.exist
			expect(res.body[0].status).to.equal('delivered')
			expect(res.body.map((order: any) => order.createdAt)).to.have.lengthOf(1)
			expect(res.body.map((order: any) => order.updatedAt)).to.have.lengthOf(1)
			expect(res.body.map((order: any) => order._id)).to.have.lengthOf(1)
		})

		it('should update the status of multiple orders', async function () {
			await agent().patch('/api/v1/orders').send({
				orderIds: [order1.id, order2.id],
				status: 'delivered'
			}).set('Cookie', adminSessionCookie)
			const updatedOrder1 = await OrderModel.findById(order1.id)
			const updatedOrder2 = await OrderModel.findById(order2.id)
			expect(updatedOrder1).to.exist
			expect(updatedOrder1?.status).to.equal('delivered')
			expect(updatedOrder2).to.exist
			expect(updatedOrder2?.status).to.equal('delivered')
		})

		it('should return the updated orders', async function () {
			const res = await agent().patch('/api/v1/orders').send({
				orderIds: [order1.id, order2.id],
				status: 'delivered'
			}).set('Cookie', adminSessionCookie)
			expect(res.body).to.exist
			expect(res.body[0].status).to.equal('delivered')
			expect(res.body[1].status).to.equal('delivered')
			expect(res.body.map((order: any) => order.createdAt)).to.have.lengthOf(2)
			expect(res.body.map((order: any) => order.updatedAt)).to.have.lengthOf(2)
			expect(res.body.map((order: any) => order._id)).to.have.lengthOf(2)
		})

		it('should return an error if orderIds is missing', async function () {
			const res = await agent().patch('/api/v1/orders').send({
				status: 'delivered'
			}).set('Cookie', adminSessionCookie)
			expect(res.body).to.exist
			expect(res.body.error).to.exist
		})

		it('should return an error if status is missing', async function () {
			const res = await agent().patch('/api/v1/orders').send({
				orderIds: [order1.id]
			}).set('Cookie', adminSessionCookie)
			expect(res.body).to.exist
			expect(res.body.error).to.exist
		})

		it('should return an error if orderIds is empty', async function () {
			const res = await agent().patch('/api/v1/orders').send({
				orderIds: [],
				status: 'delivered'
			}).set('Cookie', adminSessionCookie)
			expect(res.body).to.exist
			expect(res.body.error).to.exist
		})

		it('should return an error if orderIds contains an invalid id', async function () {
			const res = await agent().patch('/api/v1/orders').send({
				orderIds: ['invalidId'],
				status: 'delivered'
			}).set('Cookie', adminSessionCookie)
			expect(res.body).to.exist
			expect(res.body.error).to.exist
		})

		it('should not update the status of an order if the status is invalid', async function () {
			const res = await agent().patch('/api/v1/orders').send({
				orderIds: [order1.id],
				status: 'invalid'
			}).set('Cookie', adminSessionCookie)
			expect(res.body).to.exist
			expect(res.body.error).to.exist
			const updatedOrder = await OrderModel.findById(order1.id)
			expect(updatedOrder).to.exist
			expect(updatedOrder?.status).to.equal('pending')
		})

		it('should not update other orders', async function () {
			await agent().patch('/api/v1/orders').send({
				orderIds: [order1.id],
				status: 'delivered'
			}).set('Cookie', adminSessionCookie)
			const nonUpdatedOrder = await OrderModel.findById(order2.id)
			expect(nonUpdatedOrder).to.exist
			expect(nonUpdatedOrder?.status).to.equal('pending')
		})

		it('should not allow updating the _id', async function () {
			const updatedFields = {
				orderIds: [order1.id],
				_id: new mongoose.Types.ObjectId().toString()
			}

			await agent().patch('/api/v1/orders').send(updatedFields).set('Cookie', adminSessionCookie)
			const order = await OrderModel.findOne({})
			expect(order?.id.toString()).to.equal(order1.id)
		})
	})
})
