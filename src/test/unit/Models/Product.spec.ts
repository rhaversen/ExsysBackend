/* eslint-disable @typescript-eslint/no-unused-expressions */
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { expect } from 'chai'
import { describe, it } from 'mocha'
import { Types } from 'mongoose'

import ActivityModel from '../../../app/models/Activity.js'
import OptionModel, { type IOption } from '../../../app/models/Option.js'
import ProductModel from '../../../app/models/Product.js'

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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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
			} catch {
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

	describe('Delete middleware', function () {
		describe('Pre-delete middleware (deleteOne / findOneAndDelete)', function () {
			it('should remove the product from Activity.disabledProducts when deleted', async function () {
				const product = await ProductModel.create(testProductFields)
				const activity = await ActivityModel.create({
					name: 'Activity1',
					disabledProducts: [product._id]
				})

				await ProductModel.deleteOne({ _id: product._id })

				const updatedActivity = await ActivityModel.findById(activity._id)
				expect(updatedActivity?.disabledProducts).to.be.empty
			})

			it('should not affect other products in Activity.disabledProducts when deleting a product', async function () {
				const product1 = await ProductModel.create(testProductFields)
				const product2 = await ProductModel.create({
					...testProductFields,
					name: 'Test Product 2'
				})
				const activity = await ActivityModel.create({
					name: 'Activity1',
					disabledProducts: [product1._id, product2._id]
				})

				await ProductModel.deleteOne({ _id: product1._id })

				const updatedActivity = await ActivityModel.findById(activity._id)
				expect(updatedActivity?.disabledProducts).to.have.lengthOf(1)
				expect(updatedActivity?.disabledProducts?.[0].toString()).to.equal(product2._id.toString())
			})
		})

		describe('Pre-delete-many middleware', function () {
			it('should remove multiple products from Activity.disabledProducts when deleted via deleteMany', async function () {
				const product1 = await ProductModel.create(testProductFields)
				const product2 = await ProductModel.create({
					...testProductFields,
					name: 'Test Product 2'
				})
				const activity = await ActivityModel.create({
					name: 'Activity1',
					disabledProducts: [product1._id, product2._id]
				})

				await ProductModel.deleteMany({ _id: { $in: [product1._id, product2._id] } })

				const updatedActivity = await ActivityModel.findById(activity._id)
				expect(updatedActivity?.disabledProducts).to.be.empty
			})

			it('should not affect other products in Activity.disabledProducts when deleting multiple products via deleteMany', async function () {
				const product1 = await ProductModel.create(testProductFields)
				const product2 = await ProductModel.create({
					...testProductFields,
					name: 'Test Product 2'
				})
				const product3 = await ProductModel.create({
					...testProductFields,
					name: 'Test Product 3'
				})
				const activity = await ActivityModel.create({
					name: 'Activity1',
					disabledProducts: [product1._id, product2._id, product3._id]
				})

				await ProductModel.deleteMany({ _id: { $in: [product1._id, product2._id] } })

				const updatedActivity = await ActivityModel.findById(activity._id)
				expect(updatedActivity?.disabledProducts).to.have.lengthOf(1)
				expect(updatedActivity?.disabledProducts?.[0].toString()).to.equal(product3._id.toString())
			})
		})
	})
})
