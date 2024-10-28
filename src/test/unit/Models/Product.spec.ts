/* eslint-disable local/enforce-comment-order */
/* eslint-disable typescript/no-unused-vars */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { Types } from 'mongoose'

// Own modules
import ProductModel from '../../../app/models/Product.js'
import OptionModel, { type IOption } from '../../../app/models/Option.js'
import OrderModel from '../../../app/models/Order.js'
import PaymentModel from '../../../app/models/Payment.js'
import ActivityModel from '../../../app/models/Activity.js'

// Setup test environment
import '../../testSetup.js'

describe('Product Model', function () {
	let testOption: IOption

	let testProductFields: {
		name: string
		price: number
		imageURL?: string
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
			price: 50
		})

		testProductFields = {
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
			options: [testOption.id]
		}
	})

	it('should create a valid product', async function () {
		const product = await ProductModel.create(testProductFields)
		expect(product).to.exist
		expect(product.name).to.equal(testProductFields.name)
		expect(product.price).to.equal(testProductFields.price)
		expect(product.orderWindow.from.minute).to.equal(testProductFields.orderWindow.from.minute)
		expect(product.orderWindow.from.hour).to.equal(testProductFields.orderWindow.from.hour)
		expect(product.orderWindow.to.minute).to.equal(testProductFields.orderWindow.to.minute)
		expect(product.orderWindow.to.hour).to.equal(testProductFields.orderWindow.to.hour)
		expect(product.options?.[0].toString()).to.equal(testOption.id)
	})

	it('should allow two products with no options', async function () {
		const testProductFields2 = {
			name: 'Burger',
			price: 50,
			orderWindow: {
				from: {
					hour: 10,
					minute: 0
				},
				to: {
					hour: 15,
					minute: 0
				}
			}
		}
		const testProductFields3 = {
			name: 'Pizza',
			price: 100,
			orderWindow: {
				from: {
					hour: 15,
					minute: 0
				},
				to: {
					hour: 20,
					minute: 0
				}
			}
		}
		const product1 = await ProductModel.create(testProductFields2)
		const product2 = await ProductModel.create(testProductFields3)
		expect(product1).to.exist
		expect(product2).to.exist
	})

	it('should trim the name', async function () {
		const product = await ProductModel.create({
			...testProductFields,
			name: '  TestProduct  '
		})
		expect(product).to.exist
		expect(product.name).to.equal('TestProduct')
	})

	it('should create a product with no options', async function () {
		const product = await ProductModel.create({
			...testProductFields,
			options: undefined
		})
		expect(product).to.exist
		expect(product.options?.length).to.equal(0)
	})

	it('should create a product with an empty options array', async function () {
		const product = await ProductModel.create({
			...testProductFields,
			options: []
		})
		expect(product).to.exist
		expect(product.options?.length).to.equal(0)
	})

	it('should create a product with multiple options', async function () {
		const testOption2 = await OptionModel.create({
			name: 'Test Option 2',
			price: 75
		})

		const product = await ProductModel.create({
			...testProductFields,
			options: [testOption.id, testOption2.id]
		})
		expect(product).to.exist
		expect(product.options?.[0].toString()).to.equal(testOption.id)
		expect(product.options?.[1].toString()).to.equal(testOption2.id)
	})

	it('should not create a product with a non-existent option', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				options: [new Types.ObjectId()]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with a non-existent option and a real option', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				options: [new Types.ObjectId(), testOption.id]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with duplicate options', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				options: [testOption.id, testOption.id]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with a non-existent and a real option', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				options: [new Types.ObjectId(), testOption.id]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not allow a real and a non-existent option', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				options: [testOption.id, new Types.ObjectId()]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should create a product with a non-integer price', async function () {
		const product = await ProductModel.create({
			...testProductFields,
			price: 100.5
		})
		expect(product).to.exist
		expect(product.price).to.equal(100.5)
	})

	it('should not create a product with no name', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				name: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with no price', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				price: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with no orderWindow', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				orderWindow: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with a negative price', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				price: -1
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		expect(errorOccurred).to.be.true
	})

	describe('Order Window', function () {
		it('should require from minute', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: undefined
						},
						to: {
							hour: 23,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should require to minute', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 23,
							minute: undefined
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should require from hour', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: undefined,
							minute: 0
						},
						to: {
							hour: 23,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should require to hour', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: undefined,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should require from minute to be an integer', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 1.5
						},
						to: {
							hour: 23,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should require to minute to be an integer', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 23,
							minute: 49.5
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should require from hour to be an integer', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 1.5,
							minute: 0
						},
						to: {
							hour: 23,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should require to hour to be an integer', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 22.5,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		// Individual negative tests
		// from minute = -1
		// to minute = -1
		// from hour = -1
		// to hour = -1
		// from minute = 60
		// to minute = 60
		// from hour = 24
		// to hour = 24

		// Individual positive tests
		// from minute = 0
		// to minute = 0
		// from hour = 0
		// to hour = 0
		// from minute = 59
		// to minute = 59
		// from hour = 23
		// to hour = 23

		it('should not create a product with from minute = to minute && from hour = to hour', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 1,
							minute: 1
						},
						to: {
							hour: 1,
							minute: 1
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with from minute = -1', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: -1
						},
						to: {
							hour: 1,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with to minute = -1', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 1,
							minute: -1
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with from hour = -1', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: -1,
							minute: 0
						},
						to: {
							hour: 1,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with to hour = -1', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: -1,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with from minute = 60', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 60
						},
						to: {
							hour: 1,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with to minute = 60', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 1,
							minute: 60
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with from hour = 24', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 24,
							minute: 0
						},
						to: {
							hour: 1,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with to hour = 24', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 24,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			expect(errorOccurred).to.be.true
		})

		it('should create a product with from minute = 0', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 1,
						minute: 0
					}
				}
			})
			expect(product).to.exist
		})

		it('should create a product with to minute = 0', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 1,
						minute: 0
					}
				}
			})
			expect(product).to.exist
		})

		it('should create a product with from hour = 0', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 1,
						minute: 0
					}
				}
			})
			expect(product).to.exist
		})

		it('should create a product with to hour = 0', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 0,
						minute: 1
					}
				}
			})
			expect(product).to.exist
		})

		it('should create a product with from minute = 59', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 59
					},
					to: {
						hour: 1,
						minute: 0
					}
				}
			})
			expect(product).to.exist
		})

		it('should create a product with to minute = 59', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 1,
						minute: 59
					}
				}
			})
			expect(product).to.exist
		})

		it('should create a product with from hour = 23', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 23,
						minute: 0
					},
					to: {
						hour: 23,
						minute: 1
					}
				}
			})
			expect(product).to.exist
		})

		it('should create a product with to hour = 23', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 23,
						minute: 0
					}
				}
			})
			expect(product).to.exist
		})
	})
	describe('Delete', function () {
		let paymentId: Types.ObjectId
		let activityId: Types.ObjectId

		beforeEach(async function () {
			const payment = await PaymentModel.create({})
			const activity = await ActivityModel.create({ name: 'Test Activity' })
			paymentId = payment.id
			activityId = activity.id
		})

		describe('Pre-delete middleware', function () {
			it('should remove the product from orders when deleting a product', async function () {
				const product1 = await ProductModel.create(testProductFields)
				const product2 = await ProductModel.create({...testProductFields, name: 'Test Product 2'})

				const order = await OrderModel.create({
					products: [{
						id: product1.id,
						quantity: 1
					}, {
						id: product2.id,
						quantity: 1
					}],
					paymentId,
					activityId
				})

				await product1.deleteOne()

				const updatedOrder = await OrderModel.findById(order.id)

				expect(updatedOrder?.products.length).to.equal(1)
			})

			it('should remove orders with no products when deleting a product', async function () {
				const product1 = await ProductModel.create(testProductFields)

				await OrderModel.create({
					products: [{
						id: product1.id,
						quantity: 1
					}],
					paymentId,
					activityId
				})

				await product1.deleteOne()

				const orders = await OrderModel.find({})

				expect(orders.length).to.equal(0)
			})
		})

		describe('Pre-delete-many middleware', function () {
			it('should remove the products from orders when deleting multiple products', async function () {
				const product1 = await ProductModel.create(testProductFields)
				const product2 = await ProductModel.create({...testProductFields, name: 'Test Product 2'})
				const product3 = await ProductModel.create({...testProductFields, name: 'Test Product 3'})

				const order = await OrderModel.create({
					products: [{
						id: product1.id,
						quantity: 1
					}, {
						id: product2.id,
						quantity: 1
					}, {
						id: product3.id,
						quantity: 1
					}],
					paymentId,
					activityId
				})

				await ProductModel.deleteMany({ name: { $ne: 'Test Product 2' } })

				const updatedOrder = await OrderModel.findById(order.id)

				expect(updatedOrder?.products.length).to.equal(1)
			})

			it('should remove orders with no products when deleting multiple products', async function () {
				const product1 = await ProductModel.create(testProductFields)
				const product2 = await ProductModel.create({...testProductFields, name: 'Test Product 2'})

				await OrderModel.create({
					products: [{
						id: product1.id,
						quantity: 1
					}, {
						id: product2.id,
						quantity: 1
					}],
					paymentId,
					activityId
				})

				await ProductModel.deleteMany({})

				const orders = await OrderModel.find({})

				expect(orders.length).to.equal(0)
			})
		})
	})
})